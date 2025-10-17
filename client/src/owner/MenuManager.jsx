import React, { useEffect, useState } from "react";
import { api } from '../lib/api'


export default function MenuManager() {

    const [cats, setCats] = useState([]);

    useEffect(()=> { (async()=> setCats( await api.categories()))}, [])

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold">Menu Manager</h3>
            <div className="text-slate-600 text-sm mt-2">Read-only for now. Add owner endpoints to create/edit categories, items, and modifiers.</div>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cats.flatMap(c=> c.items.map(i=> (
                    <div key={i.id} className="p-4 rounded border">
                        <div className="font-medium">{i.name}</div>
                        <div className="text-sm">${Number(i.price).toFixed(2)}</div>
                    </div>
                )))}
            </div>
        </div>
    )

}