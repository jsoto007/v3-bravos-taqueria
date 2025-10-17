import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import MenuCard from '../components/MenuCard'
import Modal from '../components/Modal'
import { useCart } from '../context/CartContext'

export default function Menu(){
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null) // for modifiers modal
  const { addItem } = useCart()

  useEffect(()=>{
    (async()=>{
      try { setCats(await api.categories()) }
      finally { setLoading(false) }
    })()
  }, [])

  const startAdd = (item)=> setActive({ item, qty:1, notes:'', options:[] })
  const commitAdd = async ()=>{
    await addItem(active.item.id, { qty: active.qty, notes: active.notes, modifier_option_ids: active.options })
    setActive(null)
  }

  return (
    <div className="mt-10 mx-auto grid max-w-6xl gap-6 lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-extrabold tracking-tight text-neutral-900">Categories</div>
          <ul className="space-y-1">
            {cats.map(c=> (
              <li key={c.id}>
                <a href={`#cat-${c.id}`} className="block rounded-lg px-2 py-1.5 text-sm text-neutral-700 transition hover:bg-amber-50 hover:text-amber-700">
                  {c.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main */}
      <div>
        {loading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-neutral-800 shadow-sm">Loading menu…</div>
        ) : (
          cats.map(c=> (
            <section id={`cat-${c.id}`} key={c.id} className="mb-10 scroll-mt-24">
              <h3 className="mb-4 text-2xl font-extrabold tracking-tight text-neutral-900">{c.name}</h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {c.items.map(it=> <MenuCard key={it.id} item={it} onAdd={startAdd} />)}
              </div>
            </section>
          ))
        )}
      </div>

      <Modal
        open={!!active}
        title={active? active.item.name: ''}
        onClose={()=> setActive(null)}
        footer={
          <>
            <button
              className="rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50"
              onClick={()=> setActive(null)}
            >
              Cancel
            </button>
            <button
              className="rounded-2xl bg-green-600 px-4 py-2.5 font-bold text-white transition hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(22,163,74,0.35)]"
              onClick={commitAdd}
            >
              Add to cart
            </button>
          </>
        }
      >
        {active && (
          <div className="space-y-5">
            {active.item.modifier_groups?.map(g=> (
              <div key={g.id}>
                <div className="text-base font-bold text-neutral-900">
                  {g.name}{' '}
                  {g.required && <span className="align-middle text-xs font-semibold text-rose-700">(required)</span>}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {g.options.map(o=>{
                    const checked = active.options.includes(o.id)
                    const toggle = ()=> setActive(prev=> ({...prev, options: checked? prev.options.filter(x=>x!==o.id) : [...prev.options, o.id]}))
                    return (
                      <label
                        key={o.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition ${checked ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-200' : 'border-neutral-300 bg-white hover:bg-neutral-50'}`}
                      >
                        <input type="checkbox" checked={checked} onChange={toggle} className="size-4 accent-amber-500" />
                        <span className="text-sm font-medium text-neutral-800">
                          {o.name}{' '}
                          {Number(o.price_delta)>0 && (
                            <span className="text-neutral-500">(+${Number(o.price_delta).toFixed(2)})</span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-neutral-800">Qty</label>
              <input
                type="number"
                min={1}
                value={active.qty}
                onChange={e=> setActive(prev=> ({...prev, qty: Math.max(1, Number(e.target.value||1))}))}
                className="w-24 rounded-xl border-2 border-neutral-300 bg-white px-3 py-2 text-center text-neutral-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-800">Notes</label>
              <textarea
                value={active.notes}
                onChange={e=> setActive(prev=> ({...prev, notes: e.target.value.slice(0,300)}))}
                className="min-h-28 w-full rounded-2xl border-2 border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20"
                placeholder="No onions, allergies... (max 300)"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
