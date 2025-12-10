import pluginReact from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type PluginOption, type UserConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';

const plugins: PluginOption[] = [
  pluginReact({
    babel: {
      plugins: [['babel-plugin-react-compiler', { target: '19' }]],
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
  optimizeDeps: {
    include: ['react-is', 'scheduler'], // Agregamos scheduler aquí también por seguridad
  },
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

            // Firebase - NO usar maxSize para evitar romper dependencias internas
            {
              name: 'firebase-core',
              test: (id: string) =>
                id.includes('firebase') || id.includes('@firebase'),
              priority: 40,
            },

            // UI (Ant Design + rc-*)
            {
              name: 'ui-antd',
              test: (id: string) =>
                id.includes('antd') ||
                id.includes('@ant-design') ||
                id.includes('rc-'),
              priority: 35,
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

            // PDF / Excel
            {
              name: 'office-worker',
              test: (id: string) =>
                id.includes('jspdf') ||
                id.includes('html2canvas') ||
                id.includes('pdfmake') ||
                id.includes('exceljs'),
              priority: 30,
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
  server: { host: '0.0.0.0' },
  define: { global: 'globalThis' },
}) satisfies UserConfig;
