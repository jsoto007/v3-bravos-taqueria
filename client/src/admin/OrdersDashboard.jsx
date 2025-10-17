import React from 'react'
import StatCard from '../components/StatCard'

// NOTE: Backend currently lacks admin-wide orders endpoints. This view shows placeholders.
export default function OrdersDashboard(){
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open" value="—" hint="Add /api/admin/orders (backend)" />
        <StatCard label="In Kitchen" value="—" />
        <StatCard label="Ready" value="—" />
        <StatCard label="Delivered/Pickup" value="—" />
      </div>
      <div className="bg-white rounded-2xl shadow p-6 text-slate-600">
        To manage orders here, implement admin endpoints like GET /api/admin/orders?status=pending and PATCH /api/admin/orders/:id to update status (ready, delivered, picked_up).
      </div>
    </div>
  )
}

