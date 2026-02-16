import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.webp'],
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Trading App',
        short_name: 'Trading',
        description: 'Advanced Trading Application',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192.webp',
            sizes: '192x192',
            type: 'image/webp'
          },
          {
            src: 'icons/icon-512.webp',
            sizes: '512x512',
            type: 'image/webp'
          }
        ]
      }
    })
  ],
})
