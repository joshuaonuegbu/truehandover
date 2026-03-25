import path from 'path';
import { defineConfig, loadEnv, type Plugin, type Connect } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/** When a browser navigates to a source path (e.g. /App.tsx), send it to the SPA entry instead of serving raw TS/JS as text. */
function redirectTsxAsDocument(): Plugin {
  return {
    name: 'redirect-tsx-as-document',
    configureServer(server) {
      server.middlewares.use((req: Connect.IncomingMessage, res, next: Connect.NextFunction) => {
        const accept = req.headers.accept ?? '';
        if (req.method !== 'GET' || !accept.includes('text/html')) return next();
        const pathname = (req.url ?? '').split('?')[0] ?? '';
        if (!/\.(tsx?|jsx?)$/i.test(pathname)) return next();
        res.statusCode = 302;
        res.setHeader('Location', '/');
        res.end();
      });
    },
  };
}

/** On Windows, `/app` can collide with the real `App.tsx` file and return source code. Redirect it to a safe SPA route. */
function redirectLegacyAppPath(): Plugin {
  return {
    name: 'redirect-legacy-app-path',
    configureServer(server) {
      server.middlewares.use((req: Connect.IncomingMessage, res, next: Connect.NextFunction) => {
        const accept = req.headers.accept ?? '';
        if (req.method !== 'GET' || !accept.includes('text/html')) return next();
        const pathname = (req.url ?? '').split('?')[0] ?? '';
        if (pathname !== '/app' && pathname !== '/app/') return next();
        res.statusCode = 302;
        res.setHeader('Location', '/workspace');
        res.end();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        redirectLegacyAppPath(),
        redirectTsxAsDocument(),
        tailwindcss(),
        react(),
        VitePWA({
          registerType: 'autoUpdate',   // push updates automatically so UI edits propagate without manual prompt
          injectRegister: 'auto',
          workbox: {
            cleanupOutdatedCaches: true,
            // Pre-cache every JS/CSS chunk that Vite emits
            globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
            // Don't let the SW intercept Supabase or Stripe API calls
            navigateFallback: 'index.html',
            navigateFallbackDenylist: [/^\/api\//, /^\/rest\//, /^\/auth\//],
            runtimeCaching: [
              {
                // SWR ensures cached assets render fast while pulling fresh chunks in the background.
                urlPattern: ({ request }) =>
                  request.destination === 'script' ||
                  request.destination === 'style' ||
                  request.destination === 'font',
                handler: 'StaleWhileRevalidate',
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
          devOptions: {
            enabled: false,             // don't run SW in dev (avoids stale cache confusion)
          },
          manifest: {
            name: 'Heartflair',
            short_name: 'Heartflair',
            description: 'Client delivery and payment platform for creative freelancers.',
            theme_color: '#0f0f15',
            background_color: '#0f0f15',
            display: 'standalone',
            orientation: 'portrait-primary',
            scope: '/',
            start_url: '/workspace',
            icons: [
              { src: '/icon.svg?v=heartmark-20260324', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
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
