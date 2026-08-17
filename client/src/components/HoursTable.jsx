import { SITE } from '../data/site'
import { formatTime } from '../lib/format'

/** Hairline-ruled opening-hours rows, shared by the home summary and /visit. */
export default function HoursTable() {
  return (
    <dl>
      {SITE.hours.map((h, i) => (
        <div
          key={h.label}
          className={`flex justify-between gap-4 border-t border-divider py-3 text-base ${
            i === SITE.hours.length - 1 ? 'border-b' : ''
          }`}
        >
          <dt>{h.label}</dt>
          <dd className="whitespace-nowrap text-ink/78 tabular-nums">
            {formatTime(h.opens)} &ndash; {formatTime(h.closes)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
