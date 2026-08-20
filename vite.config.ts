import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { ensureCert } from './scripts/make-cert.mjs'

// Read at config time so the version shown on the home screen matches the
// package.json that was actually built and deployed.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// Service workers, Wake Lock and crypto.randomUUID all need a secure context.
// localhost counts as one; a LAN address does not, so testing on a phone needs
// HTTPS. Opt in with HTTPS=1 rather than eating a cert warning on every run.
const secure = process.env.HTTPS === '1'
const https = secure ? ensureCert() : undefined

// https://vite.dev/config/
export default defineConfig({
  define: {
    // Injected from package.json so the version shown on the home screen
    // always matches whatever was actually built and deployed.
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    host: true,
    https: https && { key: https.key, cert: https.cert },
    // Tunnels (ngrok, cloudflared) front the dev server on a domain Vite has
    // never heard of and would otherwise reject.
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok.app', '.trycloudflare.com'],
  },
  preview: {
    host: true,
    https: https && { key: https.key, cert: https.cert },
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok.app', '.trycloudflare.com'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-180.png'],
      workbox: {
        // Fonts are subset into many woff2 files; all of them ship offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: 'Homegrown Mafia',
        short_name: 'Homegrown',
        description:
          'Pass-and-play Mafia for one phone. Deals the cards, runs the night, works offline.',
        theme_color: '#0d1018',
        background_color: '#0d1018',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
