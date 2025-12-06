import pluginReact from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type PluginOption, type UserConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';

const plugins: PluginOption[] = [
  pluginReact(),
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
    include: ['classnames', 'react-is', 'scheduler'], // Agregamos scheduler aquí también por seguridad
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
        manualChunks(id: string) {
         // Asegurar que los helpers comunes se carguen antes
          if (id.includes('commonjsHelpers')) return 'commonjsHelpers';

          // Tus categorías de librerías
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase-core';
          if (id.includes('antd') || id.includes('@ant-design') || id.includes('rc-')) return 'ui-antd';
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdfmake') || id.includes('exceljs')) return 'office-worker';
          if (id.includes('bwip-js') || id.includes('react-qr-code') || id.includes('react-barcode')) return 'barcode-worker';
          if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('lightweight-charts')) return 'charts';
          if (id.includes('lodash') || id.includes('dayjs') || id.includes('moment')) return 'utils-vendor';

          // El resto de los paquetes de node_modules se agrupan en vendor
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
    commonjsOptions: { transformMixedEsModules: true },
  },
  plugins,
  server: { host: '0.0.0.0' },
  define: { global: 'globalThis' },
}) satisfies UserConfig;
