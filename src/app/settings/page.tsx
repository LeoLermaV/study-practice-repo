'use client'

import { useCallback, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Download, Upload, Trash2, Eye, EyeOff } from 'lucide-react'
import { getToken, setToken, clearToken, getSyncStatus, pushProgress, pullProgress, importProgress, exportProgress, isAutoSync, setAutoSync } from '@/lib/progress/sync'
import { BackupError, backupFileName, parseBackup } from '@/lib/progress/backup'
import { useHydrated } from '@/lib/useLocalStorage'
import { cn } from '@/lib/utils'

const THEMES = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const

export default function SettingsPage() {
  // Sync settings live in localStorage, which the server render cannot read.
  const hydrated = useHydrated()
  return (
    <div className="mx-auto max-w-[680px] animate-fade-in">
      <h1 className="mb-6 text-[26px] font-semibold tracking-[-0.02em] md:text-[28px]">Settings</h1>
      <div className="space-y-5">
        <Appearance />
        {hydrated ? <SyncSettings /> : <div className="h-72 animate-pulse rounded-xl bg-secondary" />}
        <BackupSettings />
        <DataSettings />
        <Panel title="Content">
          <p className="text-sm text-muted-foreground">
            Content is sourced from open-source repositories and ingested at build time.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            karanpratapsingh/system-design · donnemartin/system-design-primer · krahets/hello-algo · seanprashad/leetcode-patterns · neetcode-gh/leetcode · yangshun/tech-interview-handbook · ept/ddia-references
          </p>
        </Panel>
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-3 text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Appearance() {
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()
  const current = hydrated ? theme ?? 'system' : null
  return (
    <Panel title="Appearance">
      <div role="radiogroup" aria-label="Theme" className="inline-flex gap-0.5 rounded-lg border border-border bg-background p-[3px]">
        {THEMES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={current === t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              'h-8 rounded-md px-3.5 text-[13px] transition-colors',
              current === t.value ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">System follows your device&apos;s light or dark setting.</p>
    </Panel>
  )
}

function SyncSettings() {
  const [token, setTokenState] = useState(() => getToken() ?? '')
  const [tokenSaved, setTokenSaved] = useState(() => Boolean(getToken()))
  const [lastSync, setLastSync] = useState<number | null>(() => getSyncStatus().lastSync)
  const [lastError, setLastError] = useState<string | null>(() => getSyncStatus().lastError)
  const [showToken, setShowToken] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [autoSync, setAutoSyncState] = useState(isAutoSync)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const flash = useCallback((text: string, ok: boolean) => {
    setMessage({ text, ok })
    setTimeout(() => setMessage(null), 4000)
  }, [])

  const handleSaveToken = () => {
    const t = token.trim()
    if (!t) return
    setToken(t)
    setTokenSaved(true)
    flash('Token saved', true)
  }

  const handleClearToken = () => {
    clearToken()
    setTokenState('')
    setTokenSaved(false)
    setLastSync(null)
    setLastError(null)
    flash('Token removed', true)
  }

  const handlePush = async () => {
    const t = token.trim() || getToken()
    if (!t) {
      flash('Enter a GitHub token first', false)
      return
    }
    if (!tokenSaved) {
      setToken(t)
      setTokenSaved(true)
    }
    setSyncing(true)
    try {
      const count = await pushProgress(t)
      setLastSync(Date.now())
      setLastError(null)
      flash(`Synced ${count} topics`, true)
    } catch (e) {
      flash((e as Error).message, false)
    } finally {
      setSyncing(false)
    }
  }

  const handlePull = async () => {
    const t = token.trim() || getToken()
    if (!t) {
      flash('Enter a GitHub token first', false)
      return
    }
    if (!tokenSaved) {
      setToken(t)
      setTokenSaved(true)
    }
    setSyncing(true)
    try {
      const payload = await pullProgress(t)
      if (!payload) {
        flash('No sync data found. Push from another device first.', false)
        return
      }
      await importProgress(payload)
      setLastSync(Date.now())
      setLastError(null)
      const count = Object.keys(payload.entries).length
      flash(`Pulled ${count} topics`, true)
    } catch (e) {
      flash((e as Error).message, false)
    } finally {
      setSyncing(false)
    }
  }

  const formatDate = (ts: number | null) => (ts ? new Date(ts).toLocaleString() : 'Never')

  return (
    <Panel title="Sync">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sync your progress across devices using a private GitHub Gist. Create a{' '}
          <a
            href="https://github.com/settings/tokens/new?scopes=gist&description=FAANG%20Study"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline underline-offset-2 hover:opacity-80"
          >
            token with gist scope
          </a>{' '}
          and paste it below. The same token works on all your devices.
        </p>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="sync-token"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setTokenState(e.target.value)}
              placeholder="ghp_..."
              aria-label="GitHub token"
              autoComplete="off"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none placeholder:text-ink-faint focus:border-brand"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              aria-label={showToken ? 'Hide token' : 'Show token'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-foreground"
            >
              {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {!tokenSaved ? (
            <Button size="sm" onClick={handleSaveToken} disabled={!token.trim()} className="shrink-0 rounded-lg">
              Save
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" onClick={handleClearToken} className="shrink-0 rounded-lg text-ink-faint" title="Remove token" aria-label="Remove token">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={handlePush} disabled={syncing}>
            <Upload className="size-3.5" />
            {syncing ? 'Syncing…' : 'Push'}
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={handlePull} disabled={syncing}>
            <Download className="size-3.5" />
            {syncing ? 'Syncing…' : 'Pull'}
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Auto-sync</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoSync}
              aria-label="Auto-sync"
              onClick={() => {
                const next = !autoSync
                setAutoSyncState(next)
                setAutoSync(next)
              }}
              className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors', autoSync ? 'bg-brand' : 'bg-accent')}
            >
              <span className={cn('absolute left-0 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform', autoSync ? 'translate-x-[18px]' : 'translate-x-0.5')} />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Pulls when the app opens and pushes after each progress change. Remote progress is merged in before
            pushing, so no device can overwrite another. Requires a saved token.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Last synced: {formatDate(lastSync)}</span>
          {tokenSaved && <span className="text-success">Token saved</span>}
        </div>

        {lastError && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">Last sync failed: {lastError}</div>
        )}

        {message && (
          <div
            role="status"
            className={cn('rounded-lg px-3 py-2 text-xs', message.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}
          >
            {message.text}
          </div>
        )}
      </div>
    </Panel>
  )
}

function BackupSettings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const handleExport = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const payload = await exportProgress()
      const count = Object.keys(payload.entries).length
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = backupFileName(Date.now())
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage({ text: `Saved ${count} ${count === 1 ? 'topic' : 'topics'} to ${link.download}.`, ok: true })
    } catch (e) {
      setMessage({ text: `Export failed: ${(e as Error).message}`, ok: false })
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async (file: File) => {
    setBusy(true)
    setMessage(null)
    try {
      const payload = parseBackup(await file.text())
      const count = Object.keys(payload.entries).length
      if (count === 0 && payload.studyLog.length === 0) {
        setMessage({ text: 'That backup has no progress in it.', ok: false })
        return
      }
      await importProgress(payload)
      setMessage({ text: `Imported ${count} ${count === 1 ? 'topic' : 'topics'}. Merged with what was already here.`, ok: true })
    } catch (e) {
      setMessage({ text: e instanceof BackupError ? e.message : `Import failed: ${(e as Error).message}`, ok: false })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Panel title="Backup">
      <p className="text-sm text-muted-foreground">
        Progress lives only in this browser. Save a copy before clearing site data or switching browsers.
        Importing merges with what is already here, so nothing newer is lost.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-lg" onClick={handleExport} disabled={busy}>
          <Download className="size-3.5" />
          Export progress
        </Button>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload className="size-3.5" />
          Import from file
        </Button>
        <input
          ref={fileRef}
          id="backup-file"
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImport(file)
          }}
        />
      </div>
      {message && (
        <div role="status" className={cn('mt-3 rounded-lg px-3 py-2 text-xs', message.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
          {message.text}
        </div>
      )}
    </Panel>
  )
}

function DataSettings() {
  const [confirming, setConfirming] = useState(false)
  return (
    <Panel title="Data">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Progress</p>
          <p className="text-xs text-muted-foreground">Stored in this browser (IndexedDB)</p>
        </div>
        {confirming ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                indexedDB.deleteDatabase('keyval-store')
                window.location.reload()
              }}
            >
              Delete all progress
            </Button>
          </div>
        ) : (
          <Button variant="destructive" size="sm" className="rounded-lg" onClick={() => setConfirming(true)}>
            Clear data
          </Button>
        )}
      </div>
      {confirming && (
        <p className="mt-3 text-xs text-destructive">
          This removes every studied topic, review date and note from this browser. Synced copies in your Gist are not touched.
        </p>
      )}
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-medium">Study streak</p>
        <p className="text-xs text-muted-foreground">Counts consecutive days with any study. It resets after a full day without study.</p>
      </div>
    </Panel>
  )
}
