import { useState } from 'react'

export default function DeleteBtn({
  onClick,
  className = "",
  title = "Delete",
  disabled = false,
  type = "button",
  ...rest
}) {
  const [isActive, setIsActive] = useState(false)
  const animateMs = 1400

  const handleClick = (e) => {
    if (disabled) return
    setIsActive(true)
    onClick?.(e)
    window.setTimeout(() => setIsActive(false), animateMs)
  }

  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      onClick={handleClick}
      disabled={disabled}
      className={
        `group relative flex h-10 w-10 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-rose-200 bg-amber-50 text-rose-800 transition-colors hover:bg-amber-100
         focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`
      }
      {...rest}
    >
      {/* lid (hover-activated) */}
      <svg
        viewBox="0 0 1.625 1.625"
        className={`absolute left-1/2 -translate-x-1/2 z-10 ${isActive ? 'top-[0.95rem] animate-[spin_1.4s] duration-1000' : '-top-7'} fill-current delay-100 transition-all`}
        height="15"
        width="15"
        aria-hidden="true"
      >
        <path d="M.471 1.024v-.52a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099h-.39c-.107 0-.195 0-.195-.195" />
        <path d="M1.219.601h-.163A.1.1 0 0 1 .959.504V.341A.033.033 0 0 0 .926.309h-.26a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099v-.39a.033.033 0 0 0-.032-.033" />
        <path d="m1.245.465-.15-.15a.02.02 0 0 0-.016-.006.023.023 0 0 0-.023.022v.108c0 .036.029.065.065.065h.107a.023.023 0 0 0 .023-.023.02.02 0 0 0-.007-.016" />
      </svg>

      {/* minus (hover-rotate) */}
      <svg
        width="16"
        fill="none"
        viewBox="0 0 39 7"
        className={`origin-right duration-500 ${isActive ? 'rotate-90' : ''}`}
        aria-hidden="true"
      >
        <line strokeWidth="4" stroke="currentColor" y2="5" x2="39" y1="5" />
        <line strokeWidth="3" stroke="currentColor" y2="1.5" x2="26.0357" y1="1.5" x1="12" />
      </svg>

      {/* trash can */}
      <svg width="16" fill="none" viewBox="0 0 33 39" aria-hidden="true">
        <mask id="path-1-inside-1_8_19" fill="white">
          <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
        </mask>
        <path
          mask="url(#path-1-inside-1_8_19)"
          fill="currentColor"
          d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
        />
        <path strokeWidth="4" stroke="currentColor" d="M12 6L12 29" />
        <path strokeWidth="4" stroke="currentColor" d="M21 6V29" />
      </svg>
    </button>
  )
}