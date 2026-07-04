export default function Loading() {
  return (
    <div className="max-w-[680px] mx-auto animate-fade-in">
      <div className="h-5 w-16 rounded-lg bg-secondary animate-pulse mb-6" />
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-secondary animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-secondary animate-pulse" />
            <div className="h-5 w-12 rounded-full bg-secondary animate-pulse" />
          </div>
        </div>
      </div>
      <div className="mb-8 h-px bg-border" />
      <div className="space-y-4">
        {[{ w: '92%' }, { w: '85%' }, { w: '78%' }, { w: '90%' }, { w: '65%' }, { w: '88%' }, { w: '72%' }, { w: '95%' }, { w: '40%' }, { w: '82%' }, { w: '76%' }, { w: '91%' }, { w: '60%' }, { w: '84%' }, { w: '70%' }, { w: '93%' }, { w: '55%' }, { w: '87%' }, { w: '68%' }, { w: '80%' }].map(({ w }, i) => (
          <div key={i} className="h-4 rounded bg-secondary animate-pulse" style={{ width: w }} />
        ))}
      </div>
    </div>
  )
}
