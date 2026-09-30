import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const pinsFile = path.join(process.cwd(), 'scripts', 'source-pins.json')

/**
 * Commit each upstream repo is pinned to. Upstream renames change topic slugs,
 * and progress is keyed by slug, so content only moves when a pin is bumped
 * deliberately (`npm run pins:update`), never on an ordinary deploy.
 */
export function readPins(): Record<string, string> {
  return JSON.parse(fs.readFileSync(pinsFile, 'utf-8')) as Record<string, string>
}

export function writePins(pins: Record<string, string>): void {
  fs.writeFileSync(pinsFile, JSON.stringify(pins, null, 2) + '\n')
}

function git(args: string[], cwd?: string): string {
  // A timeout so a stalled network fetch fails instead of hanging ingest.
  return execFileSync('git', cwd ? ['-C', cwd, ...args] : args, { stdio: 'pipe', timeout: 180_000 }).toString().trim()
}

function headOf(dir: string): string | null {
  try {
    return git(['rev-parse', 'HEAD'], dir)
  } catch {
    return null
  }
}

/**
 * Makes `target` a checkout of `url` at the pinned commit for `name`. Needs no
 * network when the cache is already at the pin. Unpinned sources fall back to
 * the latest commit, with a warning.
 */
export function syncSource(name: string, url: string, target: string): void {
  const pin = readPins()[name]
  if (!pin) {
    console.warn(`  ! ${name} has no pin in scripts/source-pins.json; using the latest commit`)
    if (fs.existsSync(target)) {
      try { git(['pull', '--depth', '1'], target) } catch { console.warn(`  ! pull failed for ${name}; using the cached copy`) }
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true })
      git(['clone', '--depth', '1', url, target])
    }
    return
  }

  if (headOf(target) === pin) return

  if (!fs.existsSync(path.join(target, '.git'))) {
    fs.mkdirSync(target, { recursive: true })
    git(['init', '--quiet'], target)
    git(['remote', 'add', 'origin', url], target)
  }
  git(['fetch', '--quiet', '--depth', '1', 'origin', pin], target)
  git(['checkout', '--quiet', '--force', '--detach', 'FETCH_HEAD'], target)
  const head = headOf(target)
  if (head !== pin) throw new Error(`${name}: expected ${pin}, got ${head ?? 'no commit'}`)
}
