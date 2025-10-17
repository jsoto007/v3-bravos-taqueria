import React from 'react'
import StatCard from '../components/StatCard'

export default function Reports(){
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today Sales" value="$—" />
        <StatCard label="Orders" value="—" />
        <StatCard label="Avg Ticket" value="$—" />
        <StatCard label="Top Item" value="—" />
      </div>
      <div className="bg-white rounded-2xl shadow p-6 text-slate-600">
        Hook this up to owner analytics endpoints when available.
      </div>
    </div>
  )
}
