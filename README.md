# VentaMas Web

Aplicación web empresarial para la plataforma VentaMas, construida con **React 19**, **Vite 8 (Rolldown)** y **Firebase**. El repositorio incluye tanto el front-end principal como utilidades internas (scripts, documentación funcional y planes de seguimiento) para coordinar despliegues y limpieza de código.

## Requisitos

- Node.js 20.x o superior (modo `type: module`).
- npm 10.x o superior.
- Acceso a Firebase CLI (`firebase-tools`) para emuladores y despliegue.

## Primeros pasos

1. Instala dependencias: `npm install`.
2. Crea tus variables de entorno en `.env` (usa como referencia `firebase.json` y los docs del proyecto).
3. Entorno local: `npm run dev`.
4. Lint y calidad: `npm run lint:fast`, `npm run lint:web` o `npm run lint:all`. El wrapper `npm run lint -- <target>` requiere un target explícito.

## Scripts destacados

| Script                                   | Uso                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run dev`                            | Servidor Vite con hot reload.                                                                                |
| `npm run build`                          | Genera `dist/` listo para hosting.                                                                           |
| `npm run preview`                        | Previsualiza el build local.                                                                                 |
| `npm run lint:all`                       | Ejecuta ESLint (`web` y `functions`), Stylelint, `typecheck:all` y `typecheck:strict:pilot`.                 |
| `npm run typecheck:all`                  | Ejecuta TypeScript para app y configuración de desarrollo.                                                   |
| `npm run test:run:all`                   | Ejecuta Vitest web, Vitest de Functions y tests Node de scripts operativos.                                  |
| `npm --prefix functions run build`       | Compila Cloud Functions con `tsc`.                                                                           |
| `npm run push:alt`                       | Sincroniza la rama actual con el remote `alt` como `main` usando `tools/sync-to-alt-main.js`.                |
| `npm run deploy:*`                       | Flujos de despliegue para Firebase (beta, staging, prod) y Vercel.                                           |

## Estructura de carpetas

```
/
├─ src/                 # Código fuente React + Vite (React 19)
│  ├─ abilities/        # Definiciones de permisos (CASL)
│  ├─ assets/           # Imágenes, logos y recursos estáticos
│  ├─ components/       # Componentes UI reutilizables (Atoms, Molecules)
│  ├─ constants/        # Enums, flags y constantes globales
│  ├─ features/         # Lógica de negocio agrupada por funcionalidades
│  ├─ firebase/         # Configuración y utilidades de Firebase (Auth, Firestore)
│  ├─ hooks/            # Hooks personalizados de React
│  ├─ i18n/             # Configuraciones de internacionalización
│  ├─ models/           # Definiciones de clases y modelos de datos
│  ├─ modules/          # Organizador de módulos principales del sistema
│  ├─ pdf/              # Plantillas y lógica de generación de PDFs
│  ├─ router/           # Definición de rutas y navegación
│  ├─ services/         # Servicios de API y lógica de comunicación
│  ├─ theme/            # Configuración de estilos y temas
│  ├─ types/            # Definiciones de tipos TypeScript globales
│  └─ utils/            # Funciones de utilidad y helpers
├─ public/              # Recursos estáticos
├─ functions/           # Cloud Functions + emuladores (Firebase)
├─ docs/                # Documentos funcionales, flujos y guías de arquitectura
├─ plans/               # Planes, auditorías y backlog operativo
├─ tools/               # Scripts utilitarios basados en Node.js
├─ dist/                # Build final generado
└─ AGENTS.md            # Guía para agentes de IA (instrucciones de sistema)
```

### Carpetas y Archivos Especiales

- `docs/`: Guías de autorización, inventario, facturación y el plan de reorganización. Consulta `docs/migration-progress.md` para el estado de la migración de componentes.
- `plans/`: Centraliza auditorías, planes de arquitectura, seguridad, deploy y backlog operativo.
- `tools/`: Utilidades para mantenimiento:
  - `component-audit.mjs`: Detección de componentes duplicados.
  - `audit-imports.js`: Auditoría de dependencias e imports.
  - `sync-to-alt-main.js`: Automatización de git para ambientes alternos.
  - `configure-firebase-cors.js`: Ajusta CORS en Google Cloud Storage.
- `docs/preventa/PREVENTA_CXC_IMPLEMENTACION.md`: Documento de diseño para el módulo de Preventa y Cuentas por Cobrar.

## Calidad y mantenimiento

- **ESLint 9**: Configuración moderna para mantener el código limpio.
- **Stylelint**: Control de calidad en archivos CSS/SCSS y componentes estilizados.
- **Unused Imports**: El linter elimina automáticamente imports no utilizados en el fix.
- **Typescript**: Verificación estricta de tipos (`npm run typecheck`).

## Reglas de Facturación (Preventa/CxC)

- `data.status` (y `status`) es **solo lifecycle** del documento: `pending|completed|cancelled`.
- El **estado de pago** va separado: `paymentStatus` (`unpaid|partial|paid`) + `accumulatedPaid/balanceDue`.
- `invoice.paymentMethod` es **snapshot POS** (cobro en caja al facturar). Pagos de CxC se muestran como historial y no deben sobrescribir `paymentMethod`.
- En cuadre de caja, el **dinero cobrado** sale de métodos POS y de `receivablePayments` (cobros de deuda). No debe inferirse por `invoiceTotal` cuando no hay evidencia de cobro POS.

## Próximos pasos sugeridos

- Documenta flujos nuevos directamente en `docs/`.
- Antes de un deploy o refactor grande, revisa `plans/` y en especial `plans/backlog/`.
- Si agregas scripts de automatización, utiliza Node.js y regístralos en `package.json` y esta guía.
