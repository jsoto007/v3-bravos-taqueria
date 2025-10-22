import React, { useEffect, useRef, useState } from 'react'
import CheckmarkOverlay from './ui/CheckmarkOverlay'
import { fmtCurrency } from '../lib/api'
import { getMenuItemEmoji } from '../utils/menuPlaceholders'

export default function MenuCard({ item, onAdd }){
  const [showAnim, setShowAnim] = useState(false);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <div className="mt-10 group relative overflow-hidden rounded-3xl border border-white/5 bg-neutral-900 transition hover:-translate-y-2 hover:border-amber-400/30 hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col">
      {/* New badge (optional) */}
      {item?.is_new && (
        <span className="absolute right-5 top-5 z-10 rounded-full bg-green-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(22,163,74,0.45)]">
          New
        </span>
      )}

      {/* Image / placeholder */}
      {item?.image_url ? (
        <img
          loading="lazy"
          src={item.image_url}
          alt={item.name}
          className="h-56 w-full object-cover"
        />
      ) : (
        <div className="grid h-56 w-full place-items-center bg-gradient-to-br from-amber-400/20 to-rose-800/20 text-6xl">
          {getMenuItemEmoji(item)}
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-2 flex items-start justify-between gap-4">
          <h3 className="text-xl font-extrabold tracking-tight text-white line-clamp-2">{item.name}</h3>
          <span className="bg-gradient-to-br from-amber-400 to-amber-200 bg-clip-text text-2xl font-extrabold text-transparent whitespace-nowrap">
            {fmtCurrency(item.price)}
          </span>
        </div>

        {item?.description && (
          <p className="mb-4 text-sm leading-relaxed text-white/60 line-clamp-3">{item.description}</p>
        )}

        <div className="mt-auto pt-2">
          <button
            onClick={() => {
              setShowAnim(true);
              onAdd(item);
              if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
              hideTimerRef.current = setTimeout(() => setShowAnim(false), 900);
            }}
            className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-bold text-black transition hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(251,191,36,0.5)]"
          >
            Add to Cart
          </button>
        </div>
      </div>
      <CheckmarkOverlay
        open={showAnim}
        onClosed={() => setShowAnim(false)}
        durationMs={700}
        message="Added to cart!"
        backdropClass="bg-black/30"
        bubbleClass="bg-amber-400"
        ringClass="bg-amber-400/40"
        showRing
        sizePx={96}
      />
    </div>
  )
}
