import pluginReact from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type PluginOption, type UserConfig } from 'vite';
import { analyzer } from 'vite-bundle-analyzer';
// import tailwindcss from '@tailwindcss/vite'

const plugins: PluginOption[] = [
  pluginReact(),
  // tailwindcss(),
];

if (process.env.ANALYZE === 'true') {
  plugins.splice(
    1,
    0,
    analyzer({
      analyzerMode: 'server',
      openAnalyzer: true,
      reportTitle: 'Vite Bundle Report',
      defaultSizes: 'gzip',
      analyzerPort: 8888,
    }),
  );
}

export default defineConfig({
  optimizeDeps: {
    include: ['classnames', 'react-is'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(
        new URL('./src/components', import.meta.url),
      ),
      '@constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@templates': fileURLToPath(
        new URL('./src/views/templates', import.meta.url),
      ),
      views: fileURLToPath(new URL('./src/views', import.meta.url)),
    },
    dedupe: ['react', 'react-dom', 'styled-components'],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Librerías enormes que deben ir solas
          if (id.includes('firebase')) return 'firebase-core';

          // UI Libraries (Ant Design es gigante, lo aislamos)
          if (id.includes('antd') || id.includes('@ant-design') || id.includes('rc-')) return 'ui-antd';

          // Librerías de generación de PDFs y Excels
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdfmake')) return 'pdf-worker';
          if (id.includes('exceljs')) return 'excel-worker';
          
          // Librerías de códigos de barras y QR
          if (id.includes('bwip-js') || id.includes('react-qr-code') || id.includes('react-barcode')) return 'barcode-worker'
          
          // Utilidades pesadas
          if (id.includes('lodash') || id.includes('dayjs') || id.includes('moment')) {
            return 'utils-vendor';
          }
          // React Core (Lo esencial para arrancar)
          if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('react-router-dom')) {
            return 'react-core';
          }

          // Gráficas
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts';

          // El resto de node_modules
          if (id.includes('node_modules')) {
            return 'vendor'; // O puedes dejar tu lógica anterior aquí si prefieres
          }
        },
      },
    },
    commonjsOptions: { transformMixedEsModules: true },
  },
  plugins,
  server: { host: '0.0.0.0' },
  define: { global: 'globalThis' },
}) satisfies UserConfig;
