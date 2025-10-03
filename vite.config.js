import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createStyleImportPlugin } from 'vite-plugin-style-import';
import path from 'path';
import { analyzer } from 'vite-bundle-analyzer'
// import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  optimizeDeps: {
    include: ['classnames', 'react-is']
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
