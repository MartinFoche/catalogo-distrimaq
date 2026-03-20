import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      // Esto configura cómo se guarda el contenido
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Atrapamos las fotos de Cloudinary
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst', // Primero busca en el celu, si no está va a internet
            options: {
              cacheName: 'fotos-productos',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Distrimaq',
        short_name: 'Distrimaq',
        theme_color: 'rgb(172, 3, 3)', 
        icons: [
            {
              src: 'logo-DM.png', 
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any' 
            },
            {
              src: 'logo-DM.png', 
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable' 
            }
          ]
      }
    })
  ]
})