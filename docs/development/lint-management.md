# Gestion de Linting

Esta guia documenta los comandos reales de lint disponibles hoy en `package.json`.
La version anterior describia `npm run lint:report` y una carpeta `reports/`, pero
ese flujo ya no existe en el repositorio.

## Comandos Principales

```powershell
npm run lint
npm run lint:fast
npm run lint:web
npm run lint:all
npm run lint:styles
npm run lint:styles:styled
```

- `npm run lint`: abre el menu interactivo de `tools/lint.js` solo en una terminal interactiva. En terminal no interactivo o CI, sin target explicito, imprime `Usage` y termina con error.
- `npm run lint:fast`: ejecuta `oxlint` sobre `src` y `functions/src`.
- `npm run lint:web`: ejecuta lint rapido sobre `src`.
- `npm run lint:all`: ejecuta el chequeo mas amplio definido por `tools/lint.js`.
- `npm run lint:styles`: revisa estilos CSS/SCSS.
- `npm run lint:styles:styled`: revisa styled-components.

## Lint Por Ruta

Para validar archivos concretos usa el modo `path` del script:

```powershell
npm run lint -- path src\router\routes\routePreloaders.test.ts
```

En ejecuciones no interactivas usa siempre un target explicito:

```powershell
npm run lint -- path src\modules\sales
npm run lint -- typed src\utils\menuAccess.ts
npm run lint -- functions
```

Para un chequeo typed mas estricto sobre una ruta:

```powershell
node .\tools\lint.js path:typed src\modules\sales
```

Para aplicar fixes automaticos en una ruta:

```powershell
node .\tools\lint.js path:fix src\components\ui\Button
```

## Flujo Recomendado

1. Ejecuta un lint focal sobre los archivos tocados.
2. Ejecuta `npm run lint:fast` antes de cerrar una pasada amplia.
3. Si el cambio afecta tipado compartido, ejecuta tambien `npm run typecheck:app`.
4. Evita `eslint-disable` salvo ultimo recurso y deja una justificacion tecnica.

## Relacion Con Tests

Lint no reemplaza pruebas ni typecheck. Para cambios de frontend usa, como minimo:

```powershell
npm run lint -- path <ruta>
npm run typecheck:app
```

Para cambios en `functions/` usa tambien:

```powershell
npm --prefix functions run build
```

## Gates De Tests

Usa estos gates segun la superficie tocada:

```powershell
npm run test:run:architecture
npm run test:run
npm run test:run:functions
npm run test:run:all
```

- Architecture: `npm run test:run:architecture` ejecuta la suite estructural de Vitest para wrappers callable, boundaries de módulos, barrels `public.ts`, rutas/preloaders, acceso de menú, lazy loaders y guardrails de Functions. Úsalo cuando cambien contratos entre módulos, rutas, navegación, wrappers de Cloud Functions o exports/import graph de Functions.
- Frontend: `npm run test:run` ejecuta Vitest para la app.
- Functions: `npm run test:run:functions` ejecuta la configuracion de Vitest para Cloud Functions. Si se toca `functions/scripts/data-audit`, agrega `npm run test:run:functions:scripts`.
- All: `npm run test:run:all` encadena frontend, functions y scripts de functions. Es el gate completo antes de cerrar cambios transversales.
- Evita `npm run test` como gate no interactivo de cierre: deja Vitest en modo watcher.
