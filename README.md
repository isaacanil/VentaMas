# VentaMas Web

Aplicación web empresarial para la plataforma VentaMas, construida con React 18, Vite y Firebase. El repositorio incluye tanto el front-end principal como utilidades internas (scripts, documentación funcional y notas de pendientes) para coordinar despliegues y limpieza de código.

## Requisitos

- Node.js 20.x (modo `type: module`).
- npm 10.x o superior.
- PowerShell 7 (`pwsh`) para ejecutar `tools/check-unused-exports.ps1`.
- Acceso a Firebase CLI (`firebase-tools`) cuando se ejecuten scripts de emuladores o despliegue.

## Primeros pasos

1. Instala dependencias: `npm install`.
2. Crea tus variables de entorno en `.env` (el archivo está ignorado; toma como referencia `firebase.json` y los docs del proyecto).
3. Entorno local: `npm run dev`.
4. Lint rápido: `npm run lint` o `npm run lint:fix`.

## Scripts destacados

| Script                                   | Uso                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                            | Servidor Vite con hot reload.                                                                                       |
| `npm run build`                          | Genera `dist/` listo para hosting.                                                                                  |
| `npm run preview`                        | Previsualiza el build local.                                                                                        |
| `npm run lint:web` / `lint:web:fix`      | ESLint sobre la app React.                                                                                          |
| `npm run lint:functions`                 | ESLint dentro de `functions/`.                                                                                      |
| `npm run lint:all`                       | Combina ambos linters.                                                                                              |
| `npm run check-unused-exports[:saveCsv]` | Ejecuta `tools/check-unused-exports.ps1`; la variante `:saveCsv` guarda el reporte en `reports/unused-exports.csv`. |
| `npm run pending-updates`                | Llama a `tools/check_pending.sh` para mostrar notas pendientes.                                                     |
| `npm run storybook` / `build-storybook`  | UI de componentes.                                                                                                  |
| `npm run deploy:*`                       | Flujo de despliegue Firebase/Vercel (revisar credenciales antes de usar).                                           |
| `npm run push:alt`                       | Ejecuta `tools/push-to-alt-as-main.sh` y publica la rama actual como `main` en el remote `alt`.                     |

## Estructura de carpetas

```
/
├─ src/                 # Código fuente React + Vite
├─ public/              # Recursos estáticos servidos tal cual
├─ functions/           # Cloud Functions + emuladores
├─ docs/                # Documentos funcionales, flujos y guías
├─ pending/             # Notas cortas con tareas pendientes
├─ tools/               # Scripts utilitarios (bash/pwsh/node)
├─ reports/             # Reportes generados por scripts (ignored)
├─ dist/                # Build final (generado)
└─ docs/*.md            # Referencias específicas (facturación, PIN, etc.)
```

### Carpetas especiales

- `docs/`: contiene las guías funcionales de autorización, inventario, flujos de PIN, etc. Agrupa información para onboarding y auditoría; usa `docs/documentation/reference/structure-guide.md` como referencia para nombres y plantillas.
- `pending/`: mini backlog operativo (formato `YYYY-MM-DD_<tema>.md`). El archivo `pending/README.md` explica cómo mantenerlas y sugiere automatizar `tools/check_pending.sh` para revisarlas cada día.
- `reports/`: destino centralizado para salidas automáticas (como `unused-exports.csv` o futuros reportes de lint). La carpeta está listada en `.gitignore` para evitar ruido en la raíz.
- `tools/`: utilidades internas:
  - `check_unused_exports.ps1`: detecta exports sin uso en `src/`; acepta `-SaveCsv` para escribir en `reports/`.
  - `check_pending.sh`: recuerda abrir VS Code y mostrar el resumen de notas pendientes (con soporte para `notify-send`/`zenity`).
  - `push-to-alt-as-main.sh`: sincroniza la rama local actual hacia el remote `alt` como `main`, limpiando ramas antiguas.
  - `setCors.js`: script Node para ajustar la configuración CORS del bucket `ventamaxpos.appspot.com`.

## Calidad y mantenimiento

- ESLint + `eslint-plugin-unused-imports` mantienen el árbol limpio; los reportes largos pueden clonarse en `reports/`.
- Usa `npm run check-unused-exports:saveCsv` antes de eliminar componentes para contar con evidencia.
- `pending/` actúa como lista viva de tareas de seguimiento; evita dejar archivos generados en la raíz y documenta cualquier cambio relevante en `docs/`.

## Próximos pasos sugeridos

- Documenta flujos nuevos directamente en `docs/` para que queden junto al código.
- Si agregas más scripts de automatización, añádelos a `tools/` y actualiza esta guía.
