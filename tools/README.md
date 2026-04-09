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
