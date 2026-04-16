# Scripts de Desarrollo

Esta carpeta contiene scripts de utilidad escritos en Node.js para el mantenimiento y desarrollo del proyecto.

## 📋 Scripts Disponibles

Todos los scripts deben ejecutarse con Node.js desde la raíz del proyecto o desde esta carpeta.

### Gestión de Linting

- **`lint.js`** - App de consola para ejecutar modos de lint (`path`, `typed`, `functions`, `styles`, `all`) sin recordar comandos.
  - Recomendado usar vía npm: `npm run lint`

- **`analyze-lint-by-file.js`** - Genera estadísticas de errores de linting por archivo.
- **`analyze-file-sizes.js`** - Analiza el tamaño de los archivos para encontrar posibles problemas de bundle.
- **`audit-report.js`** - Genera reportes de auditoría de código.

### Mantenimiento de Código

- **`find-unused-exports.js`** - Detecta y reporta exportaciones (exports) que no se están utilizando.
- **`validate-imports.js`** - Verifica la integridad de las importaciones.
- **`fix-broken-imports.js`** - Script automático para corregir imports rotos.
- **`audit-imports.js`** - Auditoría profunda de dependencias entre módulos.
- **`scan-encoding.js`** / **`scan-encoding-issues.js`** - Detecta problemas de codificación de caracteres.
- **`scan-utf8-bom.js`** - Identifica archivos con BOM que pueden causar problemas en el parser.
- **`scan-suppressions.js`** - Escanea comentarios tipo `@ts-ignore` o `eslint-disable`.

### Utilidades de Git y Flujo de Trabajo

- **`deploy.js`** - App de consola para despliegues (`prod`, `staging`, `beta`, `vercel`) con menú interactivo y control de build.
  - Recomendado usar vía npm: `npm run deploy`

- **`sync-to-alt-main.js`** - Sincroniza la rama actual con el remoto `alt`.

### Configuración

- **`configure-firebase-cors.js`** - Configuración de CORS para buckets de Google Cloud Storage.
- **`check-env.js`** - Valida la existencia y contenido del archivo `.env`.

### Seeds parciales Firebase

- **`export-business-slice.mjs`** - Exporta un slice parcial de Firestore por dominios (`identity`, `sales`, `inventory`, `receivables`, `fiscal`) para un negocio específico sin escribir en producción.
  - Requiere credenciales ADC (`GOOGLE_APPLICATION_CREDENTIALS`) o sesión válida de Application Default Credentials.
  - Ejemplo:
    ```powershell
    node .\tools\export-business-slice.mjs `
      --business-id=X63aIFwHzk3r0gmT8w6P `
      --username=dev#3407 `
      --invoice-numbers=953,954,955,956,957,961,962,963,964,965,966,967,968,969 `
      --domains=identity,sales,inventory,receivables,fiscal
    ```

- **`import-business-slice-to-emulator.mjs`** - Importa el JSON exportado hacia Firestore Emulator. Falla si `FIRESTORE_EMULATOR_HOST` no está definido.
  - Resuelve `projectId` en este orden: `--project-id`, `manifest.projectId`, `GCLOUD_PROJECT` / `GOOGLE_CLOUD_PROJECT`, `.firebaserc`.
  - Ejemplo:
    ```powershell
    $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"
    node .\tools\import-business-slice-to-emulator.mjs `
      --in=.\tmp\emulator-seeds\X63aIFwHzk3r0gmT8w6P\business-slice.json
    ```

### CLI local unificado

- **`local-dev-cli.mjs`** - Orquesta entorno local: cierra procesos viejos en puertos gestionados, fuerza Java 21 si existe en `C:\Tools`, arranca `auth+firestore+functions`, importa el `business-slice.json` mas reciente y levanta Vite con `VITE_USE_EMULATORS=1`.
  - Alias existente:
    ```powershell
    npm run dev:emulators
    ```
  - Estado:
    ```powershell
    npm run dev:local:status
    ```
  - Arranque completo:
    ```powershell
    npm run dev:local
    ```
  - Arranque sin seed o sin Vite:
    ```powershell
    node .\tools\local-dev-cli.mjs start --skip-seed --no-vite
    ```
  - Seed explicito:
    ```powershell
    node .\tools\local-dev-cli.mjs start `
      --seed=.\tmp\emulator-seeds\X63aIFwHzk3r0gmT8w6P\business-slice.json
    ```
  - Stop:
    ```powershell
    npm run dev:local:stop
    ```

## Uso General

Para ejecutar cualquiera de estos scripts:

```bash
node tools/<script_name>.js
```

Ejemplos:

```bash
node tools/find-unused-exports.js
node tools/group-lint-errors.js
node tools/lint.js
node tools/lint.js path src/router/routes/loaders/accessLoaders.ts
npm run lint
npm run lint -- --help
npm run deploy
npm run deploy -- --help
```

### Tracing

- run-dev-trace-mcp.js - sets VITE_FLOW_TRACE=1. Add --auto to enable auto-capture (VITE_FLOW_TRACE_AUTO=1).
- run-dev-emulators.js - same as above, plus emulators. Add --auto to enable auto-capture.
