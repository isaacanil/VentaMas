import pluginReact from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type PluginOption, type UserConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';
import { VitePWA } from 'vite-plugin-pwa';

const plugins: PluginOption[] = [
  pluginReact({
    babel: {
      plugins: [['babel-plugin-react-compiler', { target: '19' }]],
    },
  }),
  VitePWA({
    registerType: 'autoUpdate',
    injectRegister: null,
    manifest: {
      name: 'Ventamax',
      short_name: 'Ventamax',
      description: 'Sistema de Punto de Venta Ventamax',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#1890ff',
      icons: [
        {
          src: '/ventamax.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf,eot}'],
      cleanupOutdatedCaches: true,
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      skipWaiting: true,
      clientsClaim: true,
    },
    devOptions: {
      enabled: false,
    },
  }),
];

// Configuración del analizador si lo necesitas
if (process.env.ANALYZE === 'true') {
  plugins.push(
    analyzer({
      analyzerMode: 'server',
      openAnalyzer: true,
      reportTitle: 'Vite Bundle Report',
      defaultSizes: 'gzip',
      analyzerPort: 8888,
    })
  );
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@templates': fileURLToPath(new URL('./src/views/templates', import.meta.url)),
      views: fileURLToPath(new URL('./src/views', import.meta.url)),
    },
    // Esto es CRUCIAL para evitar el error de createContext
    dedupe: ['react', 'react-dom', 'scheduler', 'object-assign', 'styled-components'],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        advancedChunks: {
          // Opcional: tamaño mínimo global para que valga la pena crear chunks
          // minSize: 20 * 1024, // 20 KB

          groups: [
            // Helpers comunes de CJS (opcional, pero lo mantengo como en tu config)
            {
              name: 'commonjs-helpers',
              test: (id: string) => id.includes('commonjsHelpers'),
              priority: 50,
            },

            // Editor (Lexical)
            {
              name: 'editor',
              test: (id: string) =>
                id.includes('lexical') || id.includes('@lexical'),
              priority: 45,
            },

            // Firebase
            {
              name: 'firebase',
              test: (id: string) =>
                /node_modules[\\/](firebase|@firebase)[\\/]/.test(id),
              priority: 45,
            },

            // UI (Ant Design + rc-* + icons)
            {
              name: 'ui-rc',
              test: (id: string) => /node_modules[\\/](?:@rc-component|rc-)[\\/]/.test(id),
              priority: 36,
            },

            // 2) Antd (solo antd)
            {
              name: 'ui-antd',
              test: (id: string) => /node_modules[\\/]antd[\\/]/.test(id),
              priority: 35,
            },
            {
              name: 'ui-antd-icons',
              test: (id: string) =>
                /node_modules[\\/](?:@ant-design[\\/]icons|@ant-design[\\/]icons-svg)[\\/]/.test(id),
              priority: 37,
            },

            // Animation (Framer Motion)
            {
              name: 'motion',
              test: (id: string) => id.includes('framer-motion'),
              priority: 32,
            },

            // Router
            {
              name: 'router',
              test: (id: string) =>
                id.includes('react-router') || id.includes('react-router-dom'),
              priority: 31,
            },

            // React Query
            {
              name: 'react-query',
              test: (id: string) => id.includes('@tanstack'),
              priority: 31,
            },

            // PDF / Excel / Canvas (cargar bajo demanda)
            {
              name: 'pdfmake-fonts',
              test: (id: string) =>
                /node_modules[\\/]pdfmake[\\/]build[\\/]vfs_fonts/.test(id),
              priority: 31,
            },
            {
              name: 'pdfmake',
              test: (id: string) => /node_modules[\\/]pdfmake[\\/]/.test(id),
              priority: 30,
            },
            {
              name: 'jspdf',
              test: (id: string) =>
                /node_modules[\\/](jspdf|jspdf-autotable)[\\/]/.test(id),
              priority: 29,
            },
            {
              name: 'exceljs',
              test: (id: string) => /node_modules[\\/]exceljs[\\/]/.test(id),
              priority: 28,
            },
            {
              name: 'html2canvas',
              test: (id: string) =>
                /node_modules[\\/]html2canvas[\\/]/.test(id),
              priority: 27,
            },

            // Códigos de barras / QR
            {
              name: 'barcode-worker',
              test: (id: string) =>
                id.includes('bwip-js') ||
                id.includes('react-qr-code') ||
                id.includes('react-barcode'),
              priority: 25,
            },

            // Gráficas
            {
              name: 'charts',
              test: (id: string) =>
                id.includes('chart.js') ||
                id.includes('react-chartjs-2') ||
                id.includes('lightweight-charts'),
              priority: 20,
            },

            // Utilidades
            {
              name: 'utils-vendor',
              test: (id: string) =>
                id.includes('lodash') ||
                id.includes('dayjs') ||
                id.includes('moment'),
              priority: 15,
            },
            {
              name: 'state',
              test: (id: string) =>
                /node_modules[\\/](?:@reduxjs|react-redux)[\\/]/.test(id),
              priority: 26,
            },

            // FontAwesome
            {
              name: 'icons-fa',
              test: (id: string) =>
                /node_modules[\\/]@fortawesome[\\/]/.test(id),
              priority: 25,
            },

            // DnD + Floating UI
            {
              name: 'dnd',
              test: (id: string) =>
                /node_modules[\\/](?:@dnd-kit|@floating-ui)[\\/]/.test(id),
              priority: 24,
            },

            // i18n
            {
              name: 'i18n',
              test: (id: string) =>
                /node_modules[\\/](?:i18next|react-i18next|@formatjs)[\\/]/.test(id),
              priority: 23,
            },

            // Search / DB clients (si los usas en runtime)
            {
              name: 'search-db',
              test: (id: string) =>
                /node_modules[\\/](?:algoliasearch|@supabase)[\\/]/.test(id),
              priority: 22,
            },

            // Markdown + parsing
            {
              name: 'markdown',
              test: (id: string) =>
                /node_modules[\\/](?:react-markdown|remark|rehype|micromark|unist)[\\/]/.test(id),
              priority: 21,
            },

            // Phone parsing (pesadito)
            {
              name: 'phone',
              test: (id: string) =>
                /node_modules[\\/]libphonenumber-js[\\/]/.test(id),
              priority: 21,
            },

            // Lightbox
            {
              name: 'lightbox',
              test: (id: string) =>
                /node_modules[\\/]yet-another-react-lightbox[\\/]/.test(id),
              priority: 20,
            },

            // Fallback para el resto de node_modules
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 5,
              // Puedes poner un minSize si no quieres chunks miniatura
              // minSize: 20 * 1024,
            },
          ],
        },
      },
    },
    commonjsOptions: { transformMixedEsModules: true },
  },
  plugins,
  server: { host: '0.0.0.0', hmr: false },
  define: { global: 'globalThis' },
}) satisfies UserConfig;
