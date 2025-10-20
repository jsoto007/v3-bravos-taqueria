import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * CheckmarkOverlay (standalone)
 * A self-contained success overlay that animates in, holds, and animates out.
 * Uses only Tailwind utilities (no external keyframes). Timings and visuals are configurable via props.
 *
 * Props:
 * - open: boolean — controls visibility. When true, the animation flow runs automatically.
 * - onClosed?: () => void — called after the exit animation completes (ideal place to flip parent state).
 * - durationMs?: number — how long the success bubble remains visible before exiting (default 1200).
 * - message?: string — optional caption beneath the check icon.
 * - exitMs?: number — duration of the exit transition (default 220).
 * - backdropClass?: string — Tailwind classes for the overlay backdrop (default "bg-black/20").
 * - bubbleClass?: string — Tailwind classes for the success bubble color (default "bg-green-600").
 * - ringClass?: string — Tailwind classes for the pulse ring (default "bg-green-600/30").
 * - showRing?: boolean — toggle the outer pulse ring (default true).
 * - captureClicks?: boolean — if true, overlay intercepts pointer events (default false lets clicks pass through).
 * - closeOnBackdropClick?: boolean — if true and captureClicks is true, clicking the backdrop exits early.
 * - sizePx?: number — diameter for the success bubble in pixels (default 96).
 * - ariaLabel?: string — accessible label for screen readers (default "Added successfully").
 */
export default function CheckmarkOverlay({
  open,
  onClosed,
  durationMs = 1200,
  message = "",
  exitMs = 220,
  backdropClass = "bg-black/20",
  bubbleClass = "bg-green-600",
  ringClass = "bg-green-600/30",
  showRing = true,
  captureClicks = false,
  closeOnBackdropClick = false,
  sizePx = 96,
  ariaLabel = "Added successfully",
}) {
  const [phase, setPhase] = useState("idle"); // idle | entering | shown | exiting
  const enterTimer = useRef(null);
  const showTimer = useRef(null);
  const exitTimer = useRef(null);

  // Helper to clear timers
  const clearAll = useCallback(() => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    if (showTimer.current) clearTimeout(showTimer.current);
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);

  // Animate on mount / when `open` flips true
  useEffect(() => {
    clearAll();
    if (!open) {
      setPhase("idle");
      return;
    }

    // 1) enter (quick scale/opacity in)
    setPhase("entering");
    enterTimer.current = setTimeout(() => {
      // 2) shown (hold for durationMs)
      setPhase("shown");
      showTimer.current = setTimeout(() => {
        // 3) exiting (fade/scale out)
        setPhase("exiting");
        exitTimer.current = setTimeout(() => {
          setPhase("idle");
          onClosed?.();
        }, exitMs);
      }, durationMs);
    }, 16); // next paint
    return clearAll;
  }, [open, durationMs, exitMs, onClosed, clearAll]);

  // Optional: ESC to close early (only when open)
  useEffect(() => {
    if (!(open || phase === "entering" || phase === "shown")) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        clearAll();
        setPhase("exiting");
        exitTimer.current = setTimeout(() => {
          setPhase("idle");
          onClosed?.();
        }, exitMs);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, phase, exitMs, onClosed, clearAll]);

  if (!open && phase === "idle") return null;

  // Phase → classes
  const isEntering = phase === "entering";
  const isShown = phase === "shown";
  const isExiting = phase === "exiting";

  const overlayOpacity =
    isEntering || isShown
      ? "opacity-100"
      : isExiting
      ? "opacity-0"
      : "opacity-0";

  const bubbleTransform =
    isEntering
      ? "opacity-100 scale-100"
      : isShown
      ? "opacity-100 scale-100"
      : isExiting
      ? "opacity-0 scale-95"
      : "opacity-0 scale-95";

  const pointerClass = captureClicks ? "pointer-events-auto" : "pointer-events-none";

  const handleBackdropClick = () => {
    if (!captureClicks || !closeOnBackdropClick) return;
    clearAll();
    setPhase("exiting");
    exitTimer.current = setTimeout(() => {
      setPhase("idle");
      onClosed?.();
    }, exitMs);
  };

  return (
    <div
      className={[
        "fixed inset-0 z-[1000] flex items-center justify-center",
        pointerClass,
        backdropClass,
        overlayOpacity,
        "transition-opacity duration-200 ease-out",
      ].join(" ")}
      aria-live="polite"
      role="status"
      aria-label={ariaLabel}
      onClick={handleBackdropClick}
    >
      {/* outer pulse ring */}
      <div className="relative">
        <span
          className={[
            showRing && (isEntering || isShown) ? "animate-ping" : "hidden",
            "absolute -inset-3 rounded-full",
            ringClass,
          ].join(" ")}
        />
        {/* bubble */}
        <div
          className={[
            "mx-auto flex items-center justify-center rounded-full shadow-xl",
            bubbleClass,
            "transition-all duration-200 ease-out",
            "will-change-transform will-change-opacity",
            bubbleTransform,
          ].join(" ")}
          style={{ width: sizePx, height: sizePx }}
        >
          <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" aria-hidden="true">
            <path
              d="M20 6 9 17l-5-5"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {message ? (
          <div className="mt-4 text-center text-sm font-medium text-white drop-shadow">
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
