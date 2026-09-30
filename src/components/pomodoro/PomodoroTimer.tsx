'use client'

import { useEffect, useRef, useState, useCallback, type FC } from 'react'
import { Play, Pause, SkipForward, RotateCcw, Timer } from 'lucide-react'
import { useHydrated } from '@/lib/useLocalStorage'

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

function loadState(cfg: PomodoroConfig): PomodoroState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PomodoroState
  } catch {}
  return defaultState(cfg)
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

/**
 * Saved timer state lives in localStorage, which the server render cannot see.
 * Until hydration a static pill holds the space; the live timer then starts
 * from the saved state directly instead of correcting itself in an effect.
 */
export const PomodoroTimer: FC = () => {
  const hydrated = useHydrated()
  if (!hydrated) {
    return (
      <span className="flex h-9 items-center gap-2 rounded-lg border border-border px-2.5 text-[13px] text-muted-foreground" aria-hidden>
        <Timer className="size-3.5" />
        <span className="font-mono tabular-nums">{formatTime(defaultConfig.work * 60 * 1000)}</span>
      </span>
    )
  }
  return <LiveTimer />
}

const LiveTimer: FC = () => {
  const [cfg, setCfg] = useState<PomodoroConfig>(loadConfig)
  const [s, setS] = useState<PomodoroState>(() => loadState(loadConfig()))
  const [display, setDisplay] = useState(() => formatTime(remaining(loadState(loadConfig()))))
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(s)
  const cfgRef = useRef(cfg)

  useEffect(() => {
    stateRef.current = s
    cfgRef.current = cfg
  })

  const apply = useCallback((next: PomodoroState) => {
    setS(next)
    setDisplay(formatTime(remaining(next)))
  }, [])

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
    apply(next)
    save(next)
    broadcast(next)
  }, [apply, save, broadcast])

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
    apply(resetState)
    save(resetState)
    broadcast(resetState)
  }, [cfg, apply, save, broadcast])

  // BroadcastChannel
  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL)
    channelRef.current = ch
    ch.onmessage = (e: MessageEvent<PomodoroState>) => apply(e.data)
    return () => ch.close()
  }, [apply])

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

  // Dismiss the panel on outside click or Escape
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const isWork = s.phase === 'work'
  const running = s.startTime > 0 && !s.paused
  const pct = s.duration > 0 ? (1 - remaining(s) / s.duration) : 0
  const phaseLabel = s.phase === 'work' ? 'Focus' : s.phase === 'shortBreak' ? 'Short break' : 'Long break'
  const phaseColor = isWork ? 'var(--brand)' : 'var(--success)'

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Focus timer, ${phaseLabel.toLowerCase()}, ${display} left`}
        className={`flex h-9 items-center gap-2 rounded-lg border px-2.5 text-[13px] transition-colors ${
          running ? 'border-border-strong bg-card text-foreground' : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground'
        }`}
      >
        {running ? (
          <span className="size-2 rounded-full" style={{ backgroundColor: phaseColor }} aria-hidden />
        ) : (
          <Timer className="size-3.5" aria-hidden />
        )}
        <span className="font-mono tabular-nums">{display}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-border bg-popover p-4 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.18)] animate-scale-in">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: phaseColor }} aria-hidden />
              {phaseLabel}
            </span>
            <span className="text-ink-faint">Cycle {Math.min(s.cycle + 1, 4)} of 4</span>
          </div>

          <p className={`mt-3 font-mono text-[34px] font-medium leading-none tracking-tight tabular-nums ${
            s.paused && s.startTime > 0 ? 'text-ink-faint' : 'text-foreground'
          }`}>
            {display}
          </p>

          <div className="mt-3 h-1 rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${Math.min(100, pct * 100)}%`, backgroundColor: phaseColor }}
            />
          </div>

          <div className="mt-4 flex items-center gap-1.5">
            {running ? (
              <button onClick={pause} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90">
                <Pause className="size-3.5" />Pause
              </button>
            ) : (
              <button onClick={start} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90">
                <Play className="size-3.5" />{s.startTime > 0 ? 'Resume' : 'Start'}
              </button>
            )}
            <button onClick={skip} title="Skip to next phase" aria-label="Skip to next phase" className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <SkipForward className="size-3.5" />
            </button>
            <button onClick={reset} title="Reset timer" aria-label="Reset timer" className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <RotateCcw className="size-3.5" />
            </button>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 text-xs text-muted-foreground">Durations (minutes)</p>
            <div className="grid grid-cols-3 gap-2">
              {(['work', 'shortBreak', 'longBreak'] as const).map((key) => (
                <label key={key} className="flex flex-col gap-1 text-[11px] text-ink-faint">
                  {key === 'shortBreak' ? 'Short break' : key === 'longBreak' ? 'Long break' : 'Focus'}
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={cfg[key]}
                    onChange={(e) => handleConfigChange(key, parseInt(e.target.value) || 1)}
                    className="h-8 w-full rounded-md border border-border bg-secondary px-2 text-center text-xs text-foreground tabular-nums outline-none focus:border-brand/60 focus:ring-2 focus:ring-ring"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
