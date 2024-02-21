import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {createStyleImportPlugin} from 'vite-plugin-style-import';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
  
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          // Aquí puedes definir tus variables de estilo personalizadas
          'btn-padding-base': '10px',
          'btn-padding-large': '6px'
          
          
          // ... otras variables
        },
        javascriptEnabled: true,
      },
    },
  },
  server: {
    host: '0.0.0.0'
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  },
  define: {
    'global': 'window'
  }
})