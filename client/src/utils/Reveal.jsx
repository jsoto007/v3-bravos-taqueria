import { useLayoutEffect, useRef } from 'react'

/**
 * Staggered scroll-reveal for a list of children.
 *
 * Replaces the old framer-motion `FadeIn`, which held children at opacity 0
 * until its animation ran — so a slow device, a JS error, or a crawler that
 * doesn't finish executing scripts saw an empty grid. Here the children render
 * visible by default and are only hidden once JS has actually taken over
 * (in useLayoutEffect, before paint, so there's no flash). If anything fails,
 * the worst case is that content simply appears without animating.
 *
 * Also drops a ~120KB dependency, which matters for Core Web Vitals.
 */
export default function Reveal({
  children,
  className = '',
  stagger = 80,
  as: Tag = 'div',
}) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (typeof IntersectionObserver === 'undefined') return

    const items = Array.from(root.children)
    items.forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${i * stagger}ms`)
      el.classList.add('reveal')
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('reveal-in')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )

    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [stagger, children])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
