'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Download, Upload, Trash2, Eye, EyeOff } from 'lucide-react'
import { getToken, setToken, clearToken, getLastSync, pushProgress, pullProgress, exportProgress, importProgress, isAutoSync, setAutoSync } from '@/lib/progress/sync'

export default function SettingsPage() {
  const [token, setTokenState] = useState('')
  const [tokenSaved, setTokenSaved] = useState(false)
  const [lastSync, setLastSync] = useState<number | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [autoSync, setAutoSyncState] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    const t = getToken()
    if (t) {
      setTokenState(t)
      setTokenSaved(true)
    }
    setLastSync(getLastSync())
    setAutoSyncState(isAutoSync())
  }, [])

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
      const payload = await exportProgress()
      await pushProgress(t, payload)
      setLastSync(Date.now())
      const count = Object.keys(payload.entries).length
      flash(`Pushed ${count} topics`, true)
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
      const count = Object.keys(payload.entries).length
      flash(`Pulled ${count} topics`, true)
    } catch (e) {
      flash((e as Error).message, false)
    } finally {
      setSyncing(false)
    }
  }

  const formatDate = (ts: number | null) => {
    if (!ts) return 'Never'
    return new Date(ts).toLocaleString()
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 tracking-tight">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sync your progress across devices using a private GitHub Gist.
            Create a{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=gist&description=FAANG%20Study"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline underline-offset-2 hover:opacity-80"
            >
              token with gist scope
            </a>
            {' '}and paste it below. The same token works on all your devices.
          </p>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setTokenState(e.target.value)}
                placeholder="ghp_..."
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-ink-faint outline-none focus:border-brand pr-10"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-foreground transition-colors"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {!tokenSaved ? (
              <Button size="sm" onClick={handleSaveToken} disabled={!token.trim()} className="rounded-full shrink-0">
                Save
              </Button>
            ) : (
              <Button variant="ghost" size="icon-sm" onClick={handleClearToken} className="shrink-0 text-ink-faint" title="Remove token">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={handlePush}
              disabled={syncing}
            >
              <Upload className="h-3.5 w-3.5" />
              {syncing ? 'Syncing...' : 'Push'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={handlePull}
              disabled={syncing}
            >
              <Download className="h-3.5 w-3.5" />
              {syncing ? 'Syncing...' : 'Pull'}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm">Auto-sync</span>
            <button
              onClick={() => {
                const next = !autoSync
                setAutoSyncState(next)
                setAutoSync(next)
              }}
              className={`relative h-6 w-10 rounded-full transition-colors ${autoSync ? 'bg-brand' : 'bg-accent'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${autoSync ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Automatically push after each progress change and pull on app open. Requires a saved token.
          </p>

          <Separator />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last synced: {formatDate(lastSync)}</span>
            {tokenSaved && <span className="text-emerald-500">Token saved</span>}
          </div>

          {message && (
            <div className={`text-xs rounded-lg px-3 py-2 ${message.ok ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Progress</p>
              <p className="text-xs text-muted-foreground">Stored locally in IndexedDB</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full"
              onClick={() => {
                if (confirm('Clear all progress data?')) {
                  indexedDB.deleteDatabase('keyval-store')
                  window.location.reload()
                }
              }}
            >
              Clear Data
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Study Streak</p>
              <p className="text-xs text-muted-foreground">Resets if you miss a day</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Content sourced from open-source repositories and ingested at build time.
          </p>
          <p className="text-xs text-muted-foreground">
            karanpratapsingh/system-design · donnemartin/system-design-primer · krahets/hello-algo · seanprashad/leetcode-patterns · neetcode-gh/leetcode · yangshun/tech-interview-handbook · ept/ddia-references
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
