import React, { useEffect, useState } from "react";
import { api } from '../lib/api'

export default function MenuManager() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.categories();
        setCats(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-amber-700">Menu Manager</h3>
        <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2 py-0.5 text-xs font-medium text-amber-700/90">
          Read-only
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Add owner endpoints to create/edit categories, items, and modifiers.
      </p>

      {/* Content */}
      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-amber-100 bg-white/70 p-4 shadow animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cats.map((c) => (
            c.items.map((i) => (
              <div
                key={i.id}
                className="group rounded-xl border border-amber-100 bg-white/70 p-4 shadow transition will-change-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2 py-0.5 text-[11px] font-medium text-amber-700/90">
                    {c.name}
                  </span>
                  <span className="text-xs text-slate-500">#{i.id}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{i.name}</div>
                    {i.description ? (
                      <div className="mt-0.5 line-clamp-2 text-xs text-slate-600">{i.description}</div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-sm font-semibold text-slate-700">
                    {money.format(Number(i.price || 0))}
                  </div>
                </div>
              </div>
            ))
          ))}
        </div>
      )}
    </div>
  );
}