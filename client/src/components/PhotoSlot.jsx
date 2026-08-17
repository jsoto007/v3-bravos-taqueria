/**
 * Matted photo from the redesign: warm 6px mat, hairline outline, gentle
 * sepia grade (the .plate class). Slots without a real photo yet render as an
 * intentional empty mat with a caption instead of a broken image — swap in
 * photography by setting `src` in src/data/photos.js.
 */
export default function PhotoSlot({ photo, aspect, className = '', loading = 'lazy' }) {
  return (
    <figure className={`plate ${className}`}>
      {photo.src ? (
        <img
          src={photo.src}
          alt={photo.alt}
          loading={loading}
          decoding="async"
          className="h-full w-full object-cover"
          style={{ aspectRatio: aspect, objectPosition: photo.position }}
        />
      ) : (
        <div
          role="img"
          aria-label={`${photo.alt} — photo coming soon`}
          className="grid h-full w-full place-items-center bg-cream p-4"
          style={{ aspectRatio: aspect }}
        >
          <span className="text-center text-xs text-ink/45">{photo.label}</span>
        </div>
      )}
    </figure>
  )
}
