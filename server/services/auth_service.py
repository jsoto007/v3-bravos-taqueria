# server/services/auth_service.py
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional, Tuple

from flask import request
from sqlalchemy.exc import SQLAlchemyError

from config import db, bcrypt
from models import (
    User,
    AuthThrottle,
)

# ----------------------------
# Data helpers / DTOs
# ----------------------------
@dataclass
class ThrottleStatus:
    is_locked: bool
    attempts: int
    locked_until: Optional[datetime]

# ----------------------------
# Normalization
# ----------------------------
def _norm_email(email: str) -> str:
    return (email or "").strip().lower()

def _client_ip() -> str:
    # Simple IP extractor; adjust if you use a CDN / proxy (X-Forwarded-For)
    return request.headers.get("X-Forwarded-For", request.remote_addr or "")

def _now() -> datetime:
    # Return timezone-aware UTC datetime to match timezone=True columns
    return datetime.now(timezone.utc)

# ----------------------------
# Throttling (cooldown)
# ----------------------------
def check_throttle(user: Optional[User] = None, email: Optional[str] = None,
                   ip: Optional[str] = None, device_id: Optional[str] = None) -> ThrottleStatus:
    """
    Returns current throttle state for a principal. Does NOT mutate DB.
    """
    norm_email = _norm_email(email) if email else None
    q = AuthThrottle.query
    if user and user.id:
        q = q.filter_by(user_id=user.id)
    elif norm_email:
        q = q.filter_by(email=norm_email)
    if ip:
        q = q.filter_by(ip_address=ip)
    if device_id:
        q = q.filter_by(device_id=device_id)
    rec = q.order_by(AuthThrottle.id.desc()).first()
    if not rec:
        return ThrottleStatus(False, 0, None)
    is_locked = bool(rec.locked_until and rec.locked_until > _now())
    return ThrottleStatus(is_locked, rec.attempts or 0, rec.locked_until)

def register_attempt(success: bool, user: Optional[User] = None, email: Optional[str] = None,
                     ip: Optional[str] = None, device_id: Optional[str] = None) -> ThrottleStatus:
    """
    Record a login attempt and apply/clear cooldown logic. Commits the DB.
    """
    rec = AuthThrottle.get_or_create(user=user, email=email, ip_address=ip, device_id=device_id)
    is_locked, attempts, locked_until = rec.register_attempt(success=success, now=_now())
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        # Return best-effort view even if commit failed
    return ThrottleStatus(is_locked, attempts, locked_until)

# ----------------------------
# Password auth (optional helper)
# ----------------------------
def password_login(email: str, password: str, ip: Optional[str] = None, device_id: Optional[str] = None) -> Tuple[Optional[User], ThrottleStatus, str]:
    """
    Example helper if you still support passwords. Returns (user_or_none, throttle, error_message).
    Enforces throttle before verifying credentials.
    """
    email_n = _norm_email(email)
    user = User.query.filter_by(email=email_n).first()
    # Evaluate throttle first
    thr = check_throttle(user=user, email=email_n, ip=ip or _client_ip(), device_id=device_id)
    if thr.is_locked:
        return None, thr, "Too many attempts. Try again later."

    if not user or not user.authenticate(password):
        thr = register_attempt(False, user=user, email=email_n, ip=ip or _client_ip(), device_id=device_id)
        return None, thr, "Invalid credentials."

    # Success → reset throttle
    thr = register_attempt(True, user=user, email=email_n, ip=ip or _client_ip(), device_id=device_id)
    user.mark_last_login()
    db.session.commit()
    return user, thr, ""
