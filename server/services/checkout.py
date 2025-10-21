


"""
Service helpers for checkout math and Stripe PaymentIntent orchestration.

This module is intentionally framework-agnostic (no Flask objects here).
Use these functions inside your Flask routes/blueprints.

Workflow (suggested):
1) Call `calculate_totals_for_cart(cart, tip_cents=...)` to compute server-authoritative totals.
2) Persist an Order using the returned totals (in your route), snapshotting cart items.
3) Call `create_or_update_payment_intent(...)` to create/update a Stripe PaymentIntent
   for the Order's grand total. Store the returned `payment_intent_id` on your Payment row
   (and optionally also on Order).
4) Listen to Stripe webhooks to mark the order as paid.

Note: This file does not import your models directly, so you can evolve them freely.
"""
from __future__ import annotations

import os
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from typing import Any, Dict, Iterable, Optional

import stripe

# ---- Stripe configuration ----------------------------------------------------
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
DEFAULT_CURRENCY = os.getenv("STRIPE_CURRENCY", "usd").lower()

# NYC example default; override via ENV TAX_RATE (e.g., 0.08875)
try:
    DEFAULT_TAX_RATE = Decimal(os.getenv("TAX_RATE", "0.0"))
except InvalidOperation:
    DEFAULT_TAX_RATE = Decimal("0.0")

# ---- Money helpers -----------------------------------------------------------

def _to_decimal(x: Any) -> Decimal:
    if isinstance(x, Decimal):
        return x
    try:
        return Decimal(str(x))
    except Exception:
        return Decimal("0")


def money_to_cents(amount: Decimal) -> int:
    """Convert a Decimal dollar amount to integer cents, rounding half up."""
    if not isinstance(amount, Decimal):
        amount = _to_decimal(amount)
    quantized = amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return int((quantized * 100).to_integral_value(rounding=ROUND_HALF_UP))


def cents_to_money(cents: int) -> Decimal:
    return (Decimal(int(cents)) / Decimal(100)).quantize(Decimal("0.01"))


# ---- Totals calculation ------------------------------------------------------

def _line_total_for_cart_item(ci: Any) -> Decimal:
    """Compute a single cart item's line total = (unit_price + modifiers) * qty.

    Expected attributes on `ci`:
      - ci.unit_price: Decimal (or float/str)
      - ci.qty: int
      - ci.modifiers: optional iterable; items may have `price_delta`
    """
    unit_price = _to_decimal(getattr(ci, "unit_price", 0))
    qty = int(getattr(ci, "qty", 0) or 0)
    base = unit_price

    # Optional modifiers with price_delta
    mods_total = Decimal("0.00")
    mods = getattr(ci, "modifiers", None)
    if mods:
        try:
            for m in mods:  # type: ignore[assignment]
                mods_total += _to_decimal(getattr(m, "price_delta", 0))
        except TypeError:
            # not iterable
            pass

    line = (base + mods_total) * qty
    return line.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compute_cart_subtotal(cart_items: Iterable[Any]) -> Decimal:
    """Sum line totals for all cart items."""
    subtotal = Decimal("0.00")
    for ci in cart_items:
        subtotal += _line_total_for_cart_item(ci)
    return subtotal.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_totals_for_cart(
    cart: Any,
    *,
    tip_cents: int = 0,
    tax_rate: Optional[Decimal] = None,
    delivery_fee_cents: int = 0,
    discount_cents: int = 0,
) -> Dict[str, Decimal]:
    """Return a dict of all money totals (Decimals) computed server-side.

    Parameters
    ----------
    cart: object with attribute `.items` iterable.
    tip_cents: absolute tip in cents (server trusts only this value, not any client dollars).
    tax_rate: Decimal (e.g., Decimal('0.08875')). If None, uses DEFAULT_TAX_RATE.
    delivery_fee_cents: absolute delivery fee in cents.
    discount_cents: absolute discount in cents.

    Returns (all Decimal):
      {
        'subtotal', 'tax_total', 'delivery_fee', 'discount_total', 'tip', 'grand_total'
      }
    """
    if tax_rate is None:
        tax_rate = DEFAULT_TAX_RATE

    items = getattr(cart, "items", []) or []
    subtotal = compute_cart_subtotal(items)

    # Tax typically applies to subtotal (jurisdiction-specific). Adjust if needed.
    tax_total = (subtotal * tax_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    delivery_fee = cents_to_money(delivery_fee_cents)
    discount_total = cents_to_money(discount_cents)
    tip = cents_to_money(int(tip_cents or 0))

    grand_total = (subtotal + tax_total + delivery_fee + tip - discount_total)
    grand_total = grand_total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "subtotal": subtotal,
        "tax_total": tax_total,
        "delivery_fee": delivery_fee,
        "discount_total": discount_total,
        "tip": tip,
        "grand_total": grand_total,
    }


# ---- Stripe PaymentIntent helpers -------------------------------------------

def create_or_update_payment_intent(
    *,
    existing_payment_intent_id: Optional[str],
    amount_cents: int,
    currency: str = DEFAULT_CURRENCY,
    metadata: Optional[Dict[str, str]] = None,
    idempotency_key: Optional[str] = None,
) -> Dict[str, str]:
    """Create a new PaymentIntent or update the amount of an existing one.

    Returns a dict with: { 'payment_intent_id', 'client_secret' }.
    """
    currency = (currency or DEFAULT_CURRENCY).lower()
    metadata = metadata or {}

    # Ensure Stripe is configured (useful for local dev if env is missing)
    if not stripe.api_key:
        raise RuntimeError("STRIPE_SECRET_KEY is not configured in the environment")

    if existing_payment_intent_id:
        # Update amount (e.g., when the customer changes tip)
        pi = stripe.PaymentIntent.modify(
            existing_payment_intent_id,
            amount=int(amount_cents),
            currency=currency,
            metadata=metadata or None,
        )
    else:
        # Create
        kwargs = {
            "amount": int(amount_cents),
            "currency": currency,
            "automatic_payment_methods": {"enabled": True},
            "metadata": metadata or None,
        }
        if idempotency_key:
            pi = stripe.PaymentIntent.create(**kwargs, idempotency_key=idempotency_key)
        else:
            pi = stripe.PaymentIntent.create(**kwargs)

    return {
        "payment_intent_id": pi.id,
        "client_secret": pi.client_secret,
    }


def recalc_and_sync_payment_intent(
    *,
    cart: Any,
    tip_cents: int,
    currency: str = DEFAULT_CURRENCY,
    existing_payment_intent_id: Optional[str] = None,
    tax_rate: Optional[Decimal] = None,
    delivery_fee_cents: int = 0,
    discount_cents: int = 0,
    metadata: Optional[Dict[str, str]] = None,
    idempotency_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Convenience helper that:
      1) Calculates authoritative totals from the cart + tip.
      2) Creates or updates a Stripe PaymentIntent for the grand total.

    Returns:
      {
        'totals': <dict of Decimals>,
        'amount_cents': <int>,
        'currency': <str>,
        'payment_intent_id': <str>,
        'client_secret': <str>,
      }
    """
    totals = calculate_totals_for_cart(
        cart,
        tip_cents=tip_cents,
        tax_rate=tax_rate,
        delivery_fee_cents=delivery_fee_cents,
        discount_cents=discount_cents,
    )
    amount_cents = money_to_cents(totals["grand_total"])

    pi_info = create_or_update_payment_intent(
        existing_payment_intent_id=existing_payment_intent_id,
        amount_cents=amount_cents,
        currency=currency,
        metadata=metadata,
        idempotency_key=idempotency_key,
    )

    return {
        "totals": totals,
        "amount_cents": amount_cents,
        "currency": (currency or DEFAULT_CURRENCY).lower(),
        **pi_info,
    }


# ---- Utility: Tip presets ----------------------------------------------------

def tip_percent_to_cents(subtotal: Decimal, percent: int) -> int:
    """Convert a % tip (e.g., 15) against subtotal -> integer cents."""
    pct = _to_decimal(percent) / Decimal(100)
    tip = (subtotal * pct).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return money_to_cents(tip)


__all__ = [
    "money_to_cents",
    "cents_to_money",
    "compute_cart_subtotal",
    "calculate_totals_for_cart",
    "create_or_update_payment_intent",
    "recalc_and_sync_payment_intent",
    "tip_percent_to_cents",
]