import pluginReact from '@vitejs/plugin-react';
import { availableParallelism } from 'node:os';
import { fileURLToPath, URL } from 'node:url';
import {
  defineConfig,
  type PluginOption,
  type UserConfig,
  withFilter,
} from 'vite';
import { analyzer } from 'vite-bundle-analyzer';
import Tinypool from 'tinypool';

// Usa REACT_COMPILER=true solo cuando quieras el React Compiler (ej: deploy a prod)
const useReactCompiler = process.env.REACT_COMPILER === 'true';
const buildTimestamp = new Date().toISOString();
const buildId =
  process.env.VITE_APP_BUILD_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  buildTimestamp;

// ──────────────────────────────────────────────────────────────────
// CLAVE DE RENDIMIENTO (ver https://vite.dev/guide/rolldown#performance):
// @vitejs/plugin-react v5+ usa Oxc (Rust nativo) para el transform,
// PERO solo si NO tiene plugins de Babel. Si agregas CUALQUIER babel plugin,
// cae a Babel (JS, lento). Por eso:
//   - pluginReact() SIN babel plugins → Oxc puro SIEMPRE
//   - React Compiler en un plugin separado que solo corre en src/
// ──────────────────────────────────────────────────────────────────

// Plugin custom que aplica React Compiler SOLO a archivos de src/
// Esto evita que Babel procese los ~3800 módulos de node_modules.
// Además, para archivos .ts (sin JSX), verifica que contengan hooks/componentes
// React antes de invocar Babel — esto ahorra ~676 archivos (~35% de src/).
// Usa worker threads para paralelizar Babel en todos los cores de CPU.
const REACT_PATTERN =
  /\b(?:use(?:State|Effect|Ref|Callback|Memo|Context|Reducer|LayoutEffect|Transition|ActionState|Formstatus|Id|InsertionEffect|SyncExternalStore|Query|Mutation|Selector|Dispatch|Store|Navigate|Location|Params|Match|SearchParams)|memo|forwardRef|createContext|lazy|Suspense)\b/;

function reactCompilerPlugin(): PluginOption {
  let pool: InstanceType<typeof Tinypool>;

  return {
    name: 'react-compiler-babel',
    apply: 'build',
    buildStart() {
      pool = new Tinypool({
        filename: new URL('./scripts/babel-worker.mjs', import.meta.url).href,
        // Dejar 1 core libre para el hilo principal (Rolldown Rust)
        maxThreads: Math.max(1, availableParallelism() - 1),
        minThreads: 1,
      });
    },
    async transform(code, id) {
      // Para archivos .ts (sin JSX), solo compilar si tienen patrones React
      if (/\.ts$/.test(id) && !REACT_PATTERN.test(code)) {
        return null;
      }

      const result = await pool.run({ code, id });
      if (!result) return null;
      return { code: result.code, map: result.map };
    },
    async buildEnd() {
      await pool?.destroy();
    },
  };
}

const plugins: PluginOption[] = [
  // pluginReact sin babel plugins → Oxc puro (Rust nativo, rapidísimo)
  pluginReact({}),
  // React Compiler solo si se solicita.
  // withFilter: Rolldown filtra en Rust antes de cruzar a JS,
  // evitando ~3800 llamadas cross-boundary para node_modules.
  ...(useReactCompiler
    ? [
        withFilter(reactCompilerPlugin(), {
          transform: { id: /[\\/]src[\\/].*\.[jt]sx?$/ },
        }),
      ]
    : []),
];

// Configuración del analizador si lo necesitas
if (process.env.ANALYZE === 'true') {
  plugins.push({
    ...analyzer({
      analyzerMode: 'server',
      openAnalyzer: true,
      reportTitle: 'Vite Bundle Report',
      defaultSizes: 'gzip',
      analyzerPort: 8888,
    }),
    apply: 'build',
  });
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Esto es CRUCIAL para evitar el error de createContext
    dedupe: [
      'react',
      'react-dom',
      'scheduler',
      'object-assign',
      'styled-components',
      'react-compiler-runtime',
    ],
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // ──────────────────────────────────────────────────────────
            // CLAVE DE RENDIMIENTO: usar RegExp en vez de funciones JS.
            // Con funciones, cada módulo (5684) cruza Rust→JS por cada
            // grupo (26) = ~148K llamadas cross-boundary. Con RegExp,
            // Rolldown las evalúa enteramente en Rust.
            // ──────────────────────────────────────────────────────────

            // Helpers comunes de CJS
            {
              name: 'commonjs-helpers',
              test: /commonjsHelpers/,
              priority: 50,
            },

            // Editor (Lexical)
            {
              name: 'editor',
              test: /[\\/](?:lexical|@lexical)[\\/]/,
              priority: 45,
            },

            // Firebase
            {
              name: 'firebase',
              test: /node_modules[\\/](?:firebase|@firebase)[\\/]/,
              priority: 45,
            },

            // UI (Ant Design + rc-* + icons)
            {
              name: 'ui-antd-icons',
              test: /node_modules[\\/](?:@ant-design[\\/]icons|@ant-design[\\/]icons-svg)[\\/]/,
              priority: 37,
            },
            {
              name: 'ui-rc',
              test: /node_modules[\\/](?:@rc-component|rc-)[\\/]/,
              priority: 36,
            },
            {
              name: 'ui-antd',
              test: /node_modules[\\/]antd[\\/]/,
              priority: 35,
            },

            // Animation (Framer Motion)
            {
              name: 'motion',
              test: /[\\/]framer-motion[\\/]/,
              priority: 32,
            },

            // Router
            {
              name: 'router',
              test: /[\\/]react-router(?:-dom)?[\\/]/,
              priority: 31,
            },

            // React Query
            {
              name: 'react-query',
              test: /[\\/]@tanstack[\\/]/,
              priority: 31,
            },

            // PDF / Excel / Canvas
            {
              name: 'pdfmake-fonts',
              test: /node_modules[\\/]pdfmake[\\/]build[\\/]vfs_fonts/,
              priority: 31,
            },
            {
              name: 'pdfmake',
              test: /node_modules[\\/]pdfmake[\\/]/,
              priority: 30,
            },
            {
              name: 'jspdf',
              test: /node_modules[\\/](?:jspdf|jspdf-autotable)[\\/]/,
              priority: 29,
            },
            {
              name: 'exceljs',
              test: /node_modules[\\/]exceljs[\\/]/,
              priority: 28,
            },
            {
              name: 'html2canvas',
              test: /node_modules[\\/]html2canvas[\\/]/,
              priority: 27,
            },

            // State management
            {
              name: 'state',
              test: /node_modules[\\/](?:@reduxjs|react-redux)[\\/]/,
              priority: 26,
            },

            // Códigos de barras / QR
            {
              name: 'barcode-worker',
              test: /[\\/](?:bwip-js|react-qr-code|react-barcode)[\\/]/,
              priority: 25,
            },

            // FontAwesome
            {
              name: 'icons-fa',
              test: /node_modules[\\/]@fortawesome[\\/]/,
              priority: 25,
            },

            // DnD + Floating UI
            {
              name: 'dnd',
              test: /node_modules[\\/](?:@dnd-kit|@floating-ui)[\\/]/,
              priority: 24,
            },

            // i18n
            {
              name: 'i18n',
              test: /node_modules[\\/](?:i18next|react-i18next|@formatjs)[\\/]/,
              priority: 23,
            },

            // Search / DB clients
            {
              name: 'search-db',
              test: /node_modules[\\/]@supabase[\\/]/,
              priority: 22,
            },

            // Markdown + parsing
            {
              name: 'markdown',
              test: /node_modules[\\/](?:react-markdown|remark|rehype|micromark|unist)[\\/]/,
              priority: 21,
            },

            // Phone parsing
            {
              name: 'phone',
              test: /node_modules[\\/]libphonenumber-js[\\/]/,
              priority: 21,
            },

            // Gráficas
            {
              name: 'charts',
              test: /[\\/](?:chart\.js|react-chartjs-2|lightweight-charts)[\\/]/,
              priority: 20,
            },

            // Lightbox
            {
              name: 'lightbox',
              test: /node_modules[\\/]yet-another-react-lightbox[\\/]/,
              priority: 20,
            },

            // Utilidades
            {
              name: 'utils-vendor',
              test: /[\\/](?:luxon|moment)[\\/]/,
              priority: 15,
            },

            // Fallback para el resto de node_modules
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 5,
            },
          ],
        },
      },
    },
  },
  plugins,
  server: { host: '0.0.0.0' },
  define: {
    global: 'globalThis',
    __APP_BUILD_ID__: JSON.stringify(buildId),
    __APP_BUILD_TIME__: JSON.stringify(buildTimestamp),
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'antd',
      '@ant-design/icons',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'react-router-dom',
      'styled-components',
      'react-compiler-runtime',
    ],
  },
}) satisfies UserConfig;
