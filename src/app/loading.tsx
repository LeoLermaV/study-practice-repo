export default function Loading() {
  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-8">
        <div className="h-10 w-56 rounded-lg bg-[#1c1c1c] animate-pulse" />
        <div className="h-5 w-64 rounded-lg bg-[#1c1c1c] animate-pulse mt-3" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[72px] rounded-xl bg-[#141414] animate-pulse" />
        ))}
      </div>
      <div className="mb-10">
        <div className="h-7 w-44 rounded-lg bg-[#1c1c1c] animate-pulse mb-4" />
        <div className="grid gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[56px] rounded-xl bg-[#141414] animate-pulse" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-[120px] rounded-xl bg-[#141414] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
