import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

// The manifest is a JSON document, so the GitHub Pages base path is added by hand.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FAANG Study',
    short_name: 'FAANG Study',
    description: 'Study and re-read FAANG interview topics, online or offline.',
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    background_color: '#f9f9fb',
    theme_color: '#f9f9fb',
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}/icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
