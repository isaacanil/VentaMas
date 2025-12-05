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
          if (id.includes('@ant-design/fast-color')) return 'ant-fast-color';
          if (id.includes('@fortawesome')) return 'fortawesome-bundle';
          if (id.includes('node_modules')) {
            return id.split('node_modules/')[1].split('/')[0];
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
