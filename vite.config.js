/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createStyleImportPlugin } from 'vite-plugin-style-import';
import path from 'path';
import { analyzer } from 'vite-bundle-analyzer';
// import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  optimizeDeps: {
    include: ['classnames']
  },
  plugins: [react(),
  // tailwindcss(),
  analyzer({
    analyzerMode: 'server',
    openAnalyzer: true,
    reportTitle: 'Vite Bundle Report',
    defaultSizes: 'gzip',
    analyzerPort: 8888
  }), createStyleImportPlugin({
    libs: [{
      libraryName: 'antd',
      esModule: true,
      resolveStyle: name => {
        return `antd/es/${name}/style/index`;
      }
    }]
  })],
  resolve: {
    alias: {
      'react-is': path.resolve(__dirname, 'node_modules/react-is/index.js'),
      '@': path.resolve(__dirname, "./src"),
      '@component': path.resolve(__dirname, './src/views/component'),
      '@pages': path.resolve(__dirname, './src/views/pages'),
      '@templates': path.resolve(__dirname, './src/views/templates'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      // '@validate': path.resolve(__dirname, './src/utils'),
      '@fbConfig': path.resolve(__dirname, './src/firebase'),
      '@schema': path.resolve(__dirname, './src/schema'),
      '@routes': path.resolve(__dirname, './src/routes')
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          'btn-padding-base': '10px',
          'btn-padding-large': '6px'
        },
        javascriptEnabled: true
      }
    }
  },
  server: {
    host: '0.0.0.0'
  },
  build: {
    minify: false,
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
      transformMixedEsModules: true
    }
  },
  define: {
    'global': 'window'
  },
  test: {
    workspace: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: 'playwright',
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.js']
      }
    }]
  }
});