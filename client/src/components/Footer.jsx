import React from 'react'
export default function Footer(){
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-6 text-sm text-slate-500">
        © {new Date().getFullYear()} Bravo's Taqueria — Order online for pickup or delivery.
      </div>
    </footer>
  )
}