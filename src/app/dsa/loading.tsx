export default function Loading() {
  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="h-10 w-[300px] rounded-lg bg-[#1c1c1c] animate-pulse mb-2" />
      <div className="h-5 w-48 rounded-lg bg-[#1c1c1c] animate-pulse mb-8" />
      <div className="grid gap-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-[56px] rounded-xl bg-[#141414] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
