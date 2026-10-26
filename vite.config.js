import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { RELEASES } from './src/changelog.js';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const release = RELEASES.find((r) => r.version === version);
if (!release) console.warn(`\n⚠️  package.json dice ${version} pero src/changelog.js no tiene esa versión: agrégala para que el reporte de cambios funcione.\n`);

// Publica /version.json junto con la app: las versiones ya instaladas lo consultan para saber qué cambia antes de actualizarse.
const versionJson = () => ({
  name: 'workversity-version-json',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version, fecha: release?.fecha || null, release: release || null }) });
  },
});

export default defineConfig({
  test: { include: ['tests/**/*.test.js'], environment: 'node' },
  define: { __APP_VERSION__: JSON.stringify(version), __APP_FECHA__: JSON.stringify(release?.fecha || '') },
  plugins: [
    react(),
    versionJson(),
    VitePWA({
      // "prompt": la nueva versión queda en espera y src/pwa/pwa.js decide CUÁNDO instalarla sola
      // (en cuanto abres la app, al mandarla al fondo o tras una cuenta regresiva; nunca mientras escribes).
      registerType: 'prompt',
      injectRegister: false, // el registro lo hace src/pwa/pwa.js
      includeAssets: ['logo.png', 'favicon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Workversity',
        short_name: 'Workversity',
        description: 'Organiza tu vida entre trabajo y universidad.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#F3F7FC',
        theme_color: '#6FA8DC',
        categories: ['productivity', 'education'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Tareas', url: '/tareas', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
          { name: 'Finanzas', url: '/finanzas', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
          { name: 'Horario', url: '/horario', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
        ],
      },
      // Service Worker propio (src/sw.js): offline + notificaciones push.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,woff2}'],
        // Mermaid (mapas conceptuales y diagramas de flujo) pesa varios MB entre sus piezas
        // de diseño de diagramas (elk, cynefin, dagre, cytoscape) que casi nadie usa en cada
        // visita. En vez de forzar esa descarga en la instalación de la app para todo el
        // mundo, se deja fuera de la precarga: se descarga solo (y se guarda en caché del
        // navegador) la primera vez que alguien entra a "Mapas y diagramas".
        globIgnores: ['**/mermaid*.js', '**/cynefin*.js', '**/cytoscape*.js', '**/dagre*.js', '**/elk-*.js'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          graficos: ['apexcharts', 'react-apexcharts'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
