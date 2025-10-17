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
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <div className="text-sm font-semibold mb-2">Categories</div>
          <ul className="space-y-1">
            {cats.map(c=> (
              <li key={c.id}><a href={`#cat-${c.id}`} className="text-slate-600 hover:text-indigo-600">{c.name}</a></li>
            ))}
          </ul>
        </div>
      </aside>

      <div>
        {loading ? <div>Loading menu...</div> : cats.map(c=> (
          <section id={`cat-${c.id}`} key={c.id} className="mb-8">
            <h3 className="text-lg font-semibold mb-3">{c.name}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {c.items.map(it=> <MenuCard key={it.id} item={it} onAdd={startAdd} />)}
            </div>
          </section>
        ))}
      </div>

      <Modal open={!!active} title={active? active.item.name: ''} onClose={()=> setActive(null)}
        footer={
          <>
            <button className="px-3 py-1 rounded" onClick={()=> setActive(null)}>Cancel</button>
            <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={commitAdd}>Add to cart</button>
          </>
        }>
        {active && (
          <div className="space-y-4">
            {active.item.modifier_groups?.map(g=> (
              <div key={g.id}>
                <div className="font-medium">{g.name} {g.required && <span className="text-xs text-rose-600">(required)</span>}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {g.options.map(o=>{
                    const checked = active.options.includes(o.id)
                    const toggle = ()=> setActive(prev=> ({...prev, options: checked? prev.options.filter(x=>x!==o.id) : [...prev.options, o.id]}))
                    return (
                      <label key={o.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${checked? 'bg-indigo-50 border-indigo-200':'bg-white'}`}>
                        <input type="checkbox" checked={checked} onChange={toggle} />
                        <span className="text-sm">{o.name} {Number(o.price_delta)>0 && <span className="text-slate-500">(+${Number(o.price_delta).toFixed(2)})</span>}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="text-sm">Qty</label>
              <input type="number" min={1} value={active.qty} onChange={e=> setActive(prev=> ({...prev, qty: Math.max(1, Number(e.target.value||1))}))} className="w-20 border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Notes</label>
              <textarea value={active.notes} onChange={e=> setActive(prev=> ({...prev, notes: e.target.value.slice(0,300)}))} className="w-full border rounded px-2 py-1" placeholder="No onions, extra salsa… (max 300)" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
