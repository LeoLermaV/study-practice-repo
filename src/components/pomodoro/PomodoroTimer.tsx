'use client'

import { useEffect, useRef, useState, useCallback, type FC } from 'react'
import { Play, Pause, SkipForward, RotateCcw, Settings } from 'lucide-react'

const STORAGE_KEY = 'pomodoro-state'
const CONFIG_KEY = 'pomodoro-config'
const CHANNEL = 'pomodoro'

interface PomodoroState {
  phase: 'work' | 'shortBreak' | 'longBreak'
  startTime: number
  elapsedBeforePause: number
  paused: boolean
  cycle: number
  duration: number
}

interface PomodoroConfig {
  work: number       // minutes
  shortBreak: number
  longBreak: number
}

const defaultConfig: PomodoroConfig = { work: 25, shortBreak: 5, longBreak: 15 }

function loadConfig(): PomodoroConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) return { ...defaultConfig, ...JSON.parse(raw) }
  } catch {}
  return defaultConfig
}

function saveConfig(c: PomodoroConfig) {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(c)) } catch {}
}

function defaultState(cfg: PomodoroConfig): PomodoroState {
  return {
    phase: 'work',
    startTime: 0,
    elapsedBeforePause: 0,
    paused: true,
    cycle: 0,
    duration: cfg.work * 60 * 1000,
  }
}

function remaining(state: PomodoroState): number {
  if (state.startTime === 0) return state.duration
  const elapsed = state.elapsedBeforePause + (state.paused ? 0 : Date.now() - state.startTime)
  return Math.max(0, state.duration - elapsed)
}

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function playBell() {
  try {
    const ctx = new AudioContext()
    const gain = ctx.createGain()
    gain.gain.value = 0.15
    gain.connect(ctx.destination)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 660
    osc.connect(gain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = 880
    osc2.connect(gain)
    osc2.start(ctx.currentTime + 0.2)
    osc2.stop(ctx.currentTime + 0.35)
  } catch {}
}

export const PomodoroTimer: FC = () => {
  const [cfg, setCfg] = useState<PomodoroConfig>(defaultConfig)
  const [s, setS] = useState<PomodoroState>(() => defaultState(defaultConfig))
  const [display, setDisplay] = useState(formatTime(defaultConfig.work * 60 * 1000))
  const [showConfig, setShowConfig] = useState(false)
  const configRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(s)
  const cfgRef = useRef(cfg)

  stateRef.current = s
  cfgRef.current = cfg

  const ms = useCallback((phase: string) => {
    if (phase === 'longBreak') return cfg.longBreak * 60 * 1000
    if (phase === 'shortBreak') return cfg.shortBreak * 60 * 1000
    return cfg.work * 60 * 1000
  }, [cfg])

  const save = useCallback((next: PomodoroState) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }, [])

  const broadcast = useCallback((next: PomodoroState) => {
    channelRef.current?.postMessage(next)
  }, [])

  const update = useCallback((next: PomodoroState) => {
    setS(next)
    save(next)
    broadcast(next)
  }, [save, broadcast])

  const start = useCallback(() => {
    const dur = ms(s.phase)
    update({
      ...s,
      paused: false,
      startTime: Date.now(),
      elapsedBeforePause: 0,
      duration: dur,
    })
  }, [s, update, ms])

  const pause = useCallback(() => {
    const e = s.elapsedBeforePause + (Date.now() - s.startTime)
    update({ ...s, paused: true, elapsedBeforePause: e })
  }, [s, update])

  const skip = useCallback(() => {
    const { phase, cycle } = s
    const isWork = phase === 'work'
    const newCycle = isWork ? cycle + 1 : cycle
    const longBrk = newCycle > 0 && newCycle % 4 === 0
    const nextPhase: PomodoroState['phase'] = isWork
      ? (longBrk ? 'longBreak' : 'shortBreak')
      : 'work'
    const dur = ms(nextPhase)
    update({
      phase: nextPhase,
      startTime: 0,
      elapsedBeforePause: 0,
      paused: true,
      cycle: isWork ? newCycle : cycle,
      duration: dur,
    })
    playBell()
  }, [s, update, ms])

  const reset = useCallback(() => {
    const dur = ms(s.phase)
    update({
      ...s,
      startTime: 0,
      elapsedBeforePause: 0,
      paused: true,
      duration: dur,
    })
  }, [s, update, ms])

  const handleConfigChange = useCallback((key: keyof PomodoroConfig, val: number) => {
    const next = { ...cfg, [key]: Math.max(1, Math.min(120, val)) }
    setCfg(next)
    saveConfig(next)
    // Reset timer with new duration
    const dur = next.work * 60 * 1000
    const resetState: PomodoroState = { phase: 'work', startTime: 0, elapsedBeforePause: 0, paused: true, cycle: 0, duration: dur }
    setS(resetState)
    save(resetState)
    broadcast(resetState)
  }, [cfg, save, broadcast])

  // Restore state + config on mount
  useEffect(() => {
    const savedCfg = loadConfig()
    if (savedCfg.work !== defaultConfig.work || savedCfg.shortBreak !== defaultConfig.shortBreak || savedCfg.longBreak !== defaultConfig.longBreak) {
      setCfg(savedCfg)
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const restored = JSON.parse(raw) as PomodoroState
        setS(restored)
      }
    } catch {}
  }, [])

  // BroadcastChannel
  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL)
    channelRef.current = ch
    ch.onmessage = (e: MessageEvent<PomodoroState>) => setS(e.data)
    return () => ch.close()
  }, [])

  // Timer tick
  useEffect(() => {
    if (s.paused || s.startTime === 0) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
      return
    }
    if (!tickRef.current) {
      tickRef.current = setInterval(() => {
        const state = stateRef.current
        const rem = remaining(state)
        setDisplay(formatTime(rem))
        if (rem <= 0) {
          if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
          playBell()
          const isWork = state.phase === 'work'
          const newCycle = isWork ? state.cycle + 1 : state.cycle
          const longBrk = newCycle > 0 && newCycle % 4 === 0
          const nextPhase: PomodoroState['phase'] = isWork
            ? (longBrk ? 'longBreak' : 'shortBreak')
            : 'work'
          const dur = cfgRef.current[nextPhase === 'longBreak' ? 'longBreak' : nextPhase === 'shortBreak' ? 'shortBreak' : 'work'] * 60 * 1000
          const next: PomodoroState = {
            phase: nextPhase, startTime: 0, elapsedBeforePause: 0, paused: true,
            cycle: isWork ? newCycle : state.cycle, duration: dur,
          }
          update(next)
        }
      }, 200)
    }
    return () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null } }
  }, [s.paused, s.startTime, update])

  // Periodic save
  useEffect(() => {
    const iv = setInterval(() => save(stateRef.current), 3000)
    return () => clearInterval(iv)
  }, [save])

  // Update display
  useEffect(() => { setDisplay(formatTime(remaining(s))) }, [s])

  // Dismiss config on click outside
  useEffect(() => {
    if (!showConfig) return
    const handler = (e: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(e.target as Node)) setShowConfig(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showConfig])

  const isWork = s.phase === 'work'
  const pct = s.duration > 0 ? (1 - remaining(s) / s.duration) : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 h-10 px-4 text-xs border-t border-sidebar-border bg-sidebar/90 backdrop-blur-md">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: isWork ? 'var(--brand)' : '#34d399' }}
        />
        <span className="text-muted-foreground font-medium">{isWork ? 'Work' : 'Break'}</span>
      </div>

      <div className="flex-1 h-1 rounded-full bg-secondary max-w-[200px] hidden md:block">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, pct * 100)}%`, backgroundColor: isWork ? 'var(--brand)' : '#34d399' }}
        />
      </div>

      <span className={`font-mono text-sm font-medium tabular-nums tracking-tight ${
        s.paused && s.startTime > 0 ? 'text-ink-faint' : isWork ? 'text-foreground' : 'text-emerald-400'
      }`}>
        {display}
      </span>

      {s.startTime > 0 && (
        <span className="text-ink-faint hidden sm:inline">Cycle {Math.min(s.cycle + 1, 4)}/4</span>
      )}

      <div className="flex items-center gap-0.5 ml-auto">
        {s.startTime === 0 ? (
          <button onClick={start} className="flex min-h-8 items-center gap-1 rounded-md px-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-[color,background-color,transform] duration-200 active:scale-[0.97]">
            <Play className="h-3 w-3" /><span className="hidden sm:inline">Start</span>
          </button>
        ) : s.paused ? (
          <button onClick={start} className="flex min-h-8 items-center gap-1 rounded-md px-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-[color,background-color,transform] duration-200 active:scale-[0.97]">
            <Play className="h-3 w-3" /><span className="hidden sm:inline">Resume</span>
          </button>
        ) : (
          <button onClick={pause} className="flex min-h-8 items-center gap-1 rounded-md px-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-[color,background-color,transform] duration-200 active:scale-[0.97]">
            <Pause className="h-3 w-3" /><span className="hidden sm:inline">Pause</span>
          </button>
        )}

        <button onClick={skip} className="flex size-8 items-center justify-center rounded-md text-ink-faint hover:text-foreground hover:bg-secondary transition-[color,background-color,transform] duration-200 active:scale-[0.97]" title="Skip">
          <SkipForward className="h-3 w-3" />
        </button>
        <button onClick={reset} className="flex size-8 items-center justify-center rounded-md text-ink-faint hover:text-foreground hover:bg-secondary transition-[color,background-color,transform] duration-200 active:scale-[0.97]" title="Reset">
          <RotateCcw className="h-3 w-3" />
        </button>

        <div className="relative" ref={configRef}>
          <button onClick={() => setShowConfig(!showConfig)} className="flex size-8 items-center justify-center rounded-md text-ink-faint hover:text-foreground hover:bg-secondary transition-[color,background-color,transform] duration-200 active:scale-[0.97]" title="Settings">
            <Settings className="h-3 w-3" />
          </button>

          {showConfig && (
            <div className="absolute bottom-10 right-0 w-52 rounded-xl bg-popover border border-border p-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-scale-in">
              <p className="text-xs font-medium mb-3 text-muted-foreground">Timer Settings</p>
              <div className="space-y-2">
                {(['work', 'shortBreak', 'longBreak'] as const).map((key) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <label className="text-xs text-muted-foreground capitalize">
                      {key === 'shortBreak' ? 'Short Break' : key === 'longBreak' ? 'Long Break' : 'Work'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={cfg[key]}
                      onChange={(e) => handleConfigChange(key, parseInt(e.target.value) || 1)}
                      className="w-16 rounded-md bg-secondary border border-border px-2 py-1 text-xs text-foreground text-center tabular-nums outline-none focus:border-brand/60 focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-[10px] text-ink-faint w-4">min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
