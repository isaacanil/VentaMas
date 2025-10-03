import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createStyleImportPlugin } from 'vite-plugin-style-import';
import { analyzer } from 'vite-bundle-analyzer'
// import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  optimizeDeps: {
    include: ['classnames', 'react-is']
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Agrupar todos los paquetes de Font Awesome en un solo chunk para evitar problemas de inicialización
          if (id.includes('@fortawesome')) {
            return 'fortawesome-bundle';
          }
          // Para el resto de los módulos, mantener el comportamiento original
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    },
    // Optimización para evitar problemas de hoisting y circulares
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
  plugins: [
    react(),
    // tailwindcss(),
    analyzer({
      analyzerMode: 'server',
      openAnalyzer: true,
      reportTitle: 'Vite Bundle Report',
      defaultSizes: 'gzip',
      analyzerPort: 8888,
    }),
    createStyleImportPlugin({
      libs: [
        {
          libraryName: 'antd',
          esModule: true,
          resolveStyle: (name) => {
            return `antd/es/${name}/style/index`;
          },
        },
      ],
    }),
  ],
  server: {
    host: '0.0.0.0'
  },
  define: {
    'global': 'globalThis'
  }
})
