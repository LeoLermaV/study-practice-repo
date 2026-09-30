import type { TopicStatus } from '@/lib/progress/status'

const LABELS: Record<TopicStatus, string> = {
  new: 'Not started',
  read: 'Read',
  studied: 'Studied',
}

export function StatusIcon({ status, className = 'size-3.5' }: { status: TopicStatus; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`shrink-0 ${className}`} role="img" aria-label={LABELS[status]}>
      {status === 'new' && (
        <circle cx="8" cy="8" r="6" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" />
      )}
      {status === 'read' && (
        <>
          <circle cx="8" cy="8" r="6" fill="none" stroke="var(--brand)" strokeWidth="1.5" />
          <path d="M8 2a6 6 0 0 1 0 12z" fill="var(--brand)" />
        </>
      )}
      {status === 'studied' && (
        <>
          <circle cx="8" cy="8" r="6.75" fill="var(--brand)" />
          <path d="m5 8.2 2 2 4-4.4" fill="none" stroke="var(--brand-foreground)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}

export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {(['new', 'read', 'studied'] as const).map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <StatusIcon status={s} />
          {LABELS[s]}
        </span>
      ))}
    </div>
  )
}
