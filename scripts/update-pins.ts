import { execFileSync } from 'child_process'
import { readPins, writePins } from './git-source'

const urls: Record<string, string> = {
  'karanpratapsingh-system-design': 'https://github.com/karanpratapsingh/system-design.git',
  'seanprashad-leetcode-patterns': 'https://github.com/seanprashad/leetcode-patterns.git',
  'neetcode-leetcode': 'https://github.com/neetcode-gh/leetcode.git',
  'krahets-hello-algo': 'https://github.com/krahets/hello-algo.git',
  'yangshun-tech-interview-handbook': 'https://github.com/yangshun/tech-interview-handbook.git',
  'donnemartin-system-design-primer': 'https://github.com/donnemartin/system-design-primer.git',
  'ept-ddia-references': 'https://github.com/ept/ddia-references',
}

/**
 * Moves every pin to its upstream's latest commit. Afterwards run
 * `npm run ingest`: it lists any topic slugs that disappeared, which would
 * orphan progress stored under them.
 */
const pins = readPins()
let changed = 0
for (const [name, url] of Object.entries(urls)) {
  const latest = execFileSync('git', ['ls-remote', url, 'HEAD'], { stdio: 'pipe', timeout: 60_000 }).toString().split(/\s/)[0]
  if (!/^[0-9a-f]{40}$/.test(latest)) throw new Error(`${name}: unexpected ls-remote output`)
  if (pins[name] !== latest) {
    console.log(`${name}: ${pins[name]?.slice(0, 12) ?? '(none)'} → ${latest.slice(0, 12)}`)
    pins[name] = latest
    changed++
  }
}
writePins(pins)
console.log(changed ? `\nUpdated ${changed} pin(s). Now run: npm run ingest` : 'All pins are already at the latest commit.')
