export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="8.5" r="5.2" className="fill-[var(--brand-soft)]" opacity="0.16" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
        <line x1="8" y1="23" x2="15.5" y2="16.5" />
        <line x1="15.5" y1="16.5" x2="24" y2="8.5" />
        <line x1="15.5" y1="16.5" x2="22" y2="21.5" />
      </g>
      <g fill="currentColor">
        <circle cx="8" cy="23" r="2.1" />
        <circle cx="15.5" cy="16.5" r="2.5" />
        <circle cx="22" cy="21.5" r="1.9" />
      </g>
      <circle cx="24" cy="8.5" r="2.9" className="fill-[var(--brand-soft)]" />
    </svg>
  )
}
