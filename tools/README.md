# Scripts de Desarrollo

Esta carpeta contiene scripts de utilidad escritos en Node.js para el mantenimiento y desarrollo del proyecto.

## 📋 Scripts Disponibles

Todos los scripts deben ejecutarse con Node.js desde la raíz del proyecto o desde esta carpeta.

### Gestión de Linting

- **`lint.js`** - App de consola para ejecutar modos de lint (`path`, `typed`, `functions`, `styles`, `all`) sin recordar comandos.
  - Recomendado usar vía npm: `npm run lint`

### Mantenimiento de Código

- **`fix-broken-imports.js`** - Script automático para corregir imports rotos.
- **`audit-imports.js`** - Analiza un log de TypeScript (`tsc_audit.txt` por defecto) y resume errores `TS2305` de exports faltantes y `TS2339` de propiedades inexistentes. No valida límites entre módulos; ese guard vive en `src/modules/moduleBoundaries.test.ts`.
- **`component-audit.mjs`** - Detecta duplicados exactos y probables en componentes de `src/`.
- **`scan-encoding.js`** - Detecta problemas de codificación de caracteres.
- **`scan-utf8-bom.js`** - Identifica archivos con BOM que pueden causar problemas en el parser.
- **`check.js`** - Ejecuta chequeos locales agregados definidos para el proyecto.

### Utilidades de Git y Flujo de Trabajo

- **`project.js`** - Menu general de operaciones del proyecto. Desde ahi se puede entrar a sincronizacion o deploy sin recordar scripts especificos.
  - Recomendado usar via npm:
    ```powershell
    npm run project
    ```
  - Ir directo a sincronizacion:
    ```powershell
    npm run project -- sync
    ```

- **`sync.js`** - App de consola para sincronizaciones entre proyectos Firebase y datos de negocio.
  - Indices Firestore desde produccion hacia staging:
    ```powershell
    npm run sync -- indexes:prod-to-staging
    ```
  - Previsualizar sin escribir ni desplegar:
    ```powershell
    npm run sync -- indexes:prod-to-staging --dry-run
    ```
  - Indices con origen/destino custom:
    ```powershell
    npm run project -- sync indexes --from=ventamaxpos --to=ventamax-staging --deploy
    ```
  - Datos de negocio hacia staging usando el script existente:
    ```powershell
    npm run project -- sync business:prod-to-staging -- --dry-run
    ```

- **`deploy.js`** - App de consola para despliegues (`prod`, `staging`, `prod:functions`, `staging:functions`, `beta`, `vercel`) con menú interactivo y control de build.
  - Recomendado usar vía npm:
    ```powershell
    npm run deploy
    npm run deploy -- staging
    npm run deploy -- staging:functions nombreDeFuncion
    npm run deploy -- staging:functions nombreDeFuncion --dry-run
    ```
  - Usa los aliases de `.firebaserc`, ejecuta el build del target cuando aplica
    y bloquea despliegues masivos de Cloud Functions en staging o produccion
    salvo guard explícito.

- **`sync-to-alt-main.js`** - Sincroniza la rama actual con el remoto `alt`.

### Configuración

- **`configure-firebase-cors.js`** - Configuración de CORS para buckets de Google Cloud Storage. La configuración vive dentro del script y no depende de un archivo externo.
  - Ejemplo:
    ```powershell
    $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\ruta\service-account.json'
    node .\tools\configure-firebase-cors.js
    Remove-Item Env:\GOOGLE_APPLICATION_CREDENTIALS
    ```
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

```powershell
node .\tools\<script_name>.js
```

Ejemplos:

```powershell
node .\tools\component-audit.mjs --outDir=.\tmp\component-audit
npm run typecheck:app *> .\tsc_audit.txt
node .\tools\audit-imports.js
node .\tools\audit-imports.js --help
node .\tools\lint.js
node .\tools\lint.js path src\router\routes\loaders\accessLoaders.ts
npm run lint
npm run lint -- --help
npm run deploy
npm run deploy -- --help
```

### Tracing

- run-dev-trace-mcp.js - sets VITE_FLOW_TRACE=1. Add --auto to enable auto-capture (VITE_FLOW_TRACE_AUTO=1).
- run-dev-emulators.js - same as above, plus emulators. Add --auto to enable auto-capture.
