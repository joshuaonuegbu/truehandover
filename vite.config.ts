import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        tailwindcss(),
        react(),
        VitePWA({
          registerType: 'prompt',       // show "Update available" prompt instead of silent auto-update
          injectRegister: 'auto',
          devOptions: {
            enabled: false,             // don't run SW in dev (avoids stale cache confusion)
          },
          workbox: {
            // Pre-cache every JS/CSS chunk that Vite emits
            globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
            // Don't let the SW intercept Supabase or Stripe API calls
            navigateFallback: 'index.html',
            navigateFallbackDenylist: [/^\/api\//, /^\/rest\//, /^\/auth\//],
            runtimeCaching: [
              {
                // Cache-first for all same-origin static assets (JS chunks, CSS)
                urlPattern: ({ request }) =>
                  request.destination === 'script' ||
                  request.destination === 'style' ||
                  request.destination === 'font',
                handler: 'CacheFirst',
                options: {
                  cacheName: 'static-assets',
                  expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
                },
              },
              {
                // Stale-while-revalidate for images
                urlPattern: ({ request }) => request.destination === 'image',
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'images',
                  expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
                },
              },
            ],
          },
          manifest: {
            name: 'TrueHandover',
            short_name: 'TrueHandover',
            description: 'Client delivery and payment platform for creative freelancers.',
            theme_color: '#0f0f15',
            background_color: '#0f0f15',
            display: 'standalone',
            orientation: 'portrait-primary',
            scope: '/',
            start_url: '/dashboard',
            icons: [
              { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
            ],
          },
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-icons': ['lucide-react'],
            },
          },
        },
        chunkSizeWarningLimit: 600,
      },
    };
});
