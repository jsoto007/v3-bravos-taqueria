import React, { useEffect, useRef, useState } from "react";

/**
 * AddToCartAnim (center-screen overlay)
 * 🛒 cart pops in the center → ✅ check appears over it → fades out → calls onFinished.
 *
 * Props:
 * - playKey: change this value (e.g., increment) to start the animation
 * - onFinished?: callback fired after the sequence completes (used to unmount)
 *
 * Usage example:
 *   const [playKey, setPlayKey] = useState(0);
 *   const [show, setShow] = useState(false);
 *   const handleClick = () => { setShow(true); setPlayKey(k => k + 1); };
 *   {show && (
 *     <AddToCartAnim playKey={playKey} onFinished={() => setShow(false)} />
 *   )}
 */
export default function AddToCartAnim({ playKey, onFinished }) {
  const [phase, setPhase] = useState("idle"); // idle | check | swap | cart | out
  const timers = useRef([]);

  useEffect(() => {
    // cleanup timers on rerun/unmount
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (playKey == null) return;

    // start sequence (cart first → then check → fade)
    setPhase("cart");
    timers.current.push(
      setTimeout(() => setPhase("check"), 500),   // cart pop → then check
      setTimeout(() => setPhase("out"), 1200),    // fade whole wrapper
      setTimeout(() => {
        setPhase("idle");
        onFinished && onFinished();
      }, 1500)
    );

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [playKey, onFinished]);

  const active = phase !== "idle";

  return (
    <div className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Embedded keyframes so this stays drop-in with Tailwind */}
      <style>{`
        @keyframes bt-center-pop {
          0% { opacity: 0; transform: scale(0); }
          55% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes bt-center-swap {
          0% { opacity: 1; transform: translate(0,0) scale(1) rotate(0deg); }
          60% { transform: translate(4px,-4px) scale(0.9) rotate(8deg); }
          100% { opacity: 0; transform: translate(0,-10px) scale(0.2) rotate(14deg); }
        }
        @keyframes bt-cart-pop {
          0% { opacity: 0; transform: scale(0) rotate(-20deg); }
          55% { transform: scale(1.15) rotate(3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes bt-fade-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .bt-anim-check-in { animation: bt-center-pop .5s cubic-bezier(0.68,-0.55,0.265,1.55) forwards; }
        .bt-anim-cart-in { animation: bt-cart-pop .5s cubic-bezier(0.68,-0.55,0.265,1.55) forwards; }
        .bt-anim-out { animation: bt-fade-out .3s ease forwards; }
      `}</style>

      <div
        className={[
          "relative flex items-center justify-center",
          active ? "opacity-100" : "opacity-0",
          phase === "out" ? "bt-anim-out" : "",
          "transition-opacity"
        ].join(" ")}
      >
        <div className="relative h-28 w-28">
          {/* Success check (green bubble) */}
          <div
            className={[
              "absolute inset-0 m-auto flex h-28 w-28 items-center justify-center rounded-full",
              "bg-green-600 text-white shadow-xl",
              phase === "check" ? "bt-anim-check-in" : "",
              (phase === "idle" || phase === "cart" || phase === "out") ? "opacity-0 scale-0" : "",
              "z-10",
            ].join(" ")}
            aria-hidden="true"
          >
            <svg
              className="h-14 w-14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          {/* Cart (amber square) */}
          <div
            className={[
              "absolute inset-0 m-auto flex h-28 w-28 items-center justify-center rounded-2xl",
              "bg-amber-400 text-black shadow-xl",
              phase === "cart" ? "bt-anim-cart-in" : "",
              (phase === "idle" || phase === "out") ? "opacity-0 scale-0" : "",
            ].join(" ")}
            aria-hidden="true"
          >
            <svg
              className="h-14 w-14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
