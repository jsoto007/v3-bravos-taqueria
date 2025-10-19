import React from 'react'
export default function Footer(){
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-6 text-sm text-slate-500 text-center">
        <p>© {new Date().getFullYear()} Bravo’s Taqueria Corp — Order online for pickup or delivery.</p>
        <p className="mt-1">
          Developed by{' '}
          <a
            href="https://sotodev.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline"
          >
            Soto Dev, LLC
          </a>.
        </p>
      </div>
    </footer>
  )
}