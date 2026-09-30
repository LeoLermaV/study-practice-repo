export default function Loading() {
  return (
    <div className="mx-auto max-w-[680px]" aria-busy="true" aria-label="Loading review">
      <div className="mb-2 h-4 w-20 animate-pulse rounded bg-secondary" />
      <div className="mb-3 h-8 w-72 animate-pulse rounded-lg bg-secondary" />
      <div className="mb-8 h-4 w-48 animate-pulse rounded bg-secondary" />
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary/70" />
        ))}
      </div>
    </div>
  )
}
