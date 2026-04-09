# Plan de Diseño: Frontend Quality CLI Hub

Este documento describe la implementación de una herramienta de línea de comandos (CLI) interactiva para centralizar todas las tareas de mantenimiento de código en el frontend de VentaMas.

## Objetivo

Proporcionar una interfaz única y amigable (`npm run check`) que permita ejecutar de forma selectiva o masiva las herramientas de calidad de código: Prettier, ESLint, TypeScript, Stylelint y Vite Build.

## Arquitectura

### 1. Interfaz de Usuario (UI)

- **Biblioteca:** `enquirer` (para el menú interactivo).
- **Estilo:** `consola` (para logs con iconos y colores premium).
- **Interactividad:** Selección mediante flechas y Enter.

### 2. Comandos Soportados

- **Full Quality Check:** Ejecución secuencial (`prettier` -> `lint` -> `tsc` -> `stylelint` -> `build`).
- **Format Code:** `npm run format`.
- **Lint Web:** `npm run lint:web`.
- **Type Check:** `npm run typecheck`.
- **Style Check:** `npm run lint:styles`.
- **Build App:** `npm run build`.

### 3. Lógica de Ejecución

- Se utilizará `child_process.spawn` para capturar la salida en tiempo real y mantener los colores de las herramientas originales.
- Manejo de errores: Si una tarea falla en el "Full Check", se detendrá el proceso y mostrará un resumen del error.

## Implementación

### Fase 1: Instalación de Dependencias

Se instalará `enquirer` para el manejo de los menús interactivos.

### Fase 2: Script Principal (`tools/check.js`)

- Un archivo Node.js con soporte ESM.
- Mapeo de opciones a comandos de `package.json`.
- Bucle de retroalimentación (preguntar si desea volver al menú al finalizar).

### Fase 3: Integración

- Añadir `"check": "node tools/check.js"` a `package.json`.

## Ejemplo de Flujo

1. Usuario corre `npm run check`.
2. Se despliega un menú:
   - [ ] Full Quality Check (All)
   - [ ] Format Code (Prettier)
   - [ ] Lint Logic (ESLint)
   - [ ] Check Types (TSC)
   - ...
3. Al seleccionar "Check Types", se ejecuta `tsc --noEmit` y se ve la barra de progreso/errores.
4. Al terminar: "¿Deseas realizar otra acción? (Sí/No)".

---

¿Listo para comenzar con la Fase 1?
