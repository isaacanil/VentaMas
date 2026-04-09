# React Doctor Repo-Wide Plan

## Context

Este plan cubre la deuda del repo completo, no solo el diff actual de la rama.

Baseline tomado el 7 de marzo de 2026 sobre un snapshot local sin `.git` para forzar escaneo total del árbol actual:

- [x] `2100` archivos fuente detectados
- [x] `172 errors`
- [x] `611 warnings`
- [x] `383` archivos con hallazgos

Comando usado:

```powershell
npx -y react-doctor@latest . --verbose --yes --project ventamax
```

Referencia del diagnóstico:

- [x] `C:\Users\jonat\AppData\Local\Temp\react-doctor-170064e6-3041-4a2f-9edd-b7c1aca3cf88`

## Current Status

- [x] El diff actual de la rama quedó limpio en React Doctor.
- [x] El diff actual de la rama quedó en `100/100`, sin `errors` ni `warnings`.
- [x] `SaleExperimental` fue removido y quedó solo el flujo normal.
- [x] Fases 1 a 5 del trabajo correctivo sobre el diff actual quedaron cerradas.
- [ ] React Doctor repo-wide todavía tiene deuda histórica importante.
- [x] Phase 1 del diff actual quedó sin `errors`.
- [x] Phases 2 a 5 del diff actual quedaron sin `warnings` activos en React Doctor.
- [ ] Phase 1 repo-wide sigue abierta.

## Progress Summary

- [x] Baseline repo-wide levantado y documentado.
- [x] Diff actual estabilizado con `react-doctor --diff` en limpio.
- [x] Build actual del proyecto pasando.
- [x] Build actual del proyecto revalidado después de los splits estructurales finales.
- [x] React Doctor repo-wide refrescado despues del batch grande.
- [ ] Reducir `172 errors` repo-wide a `0`.
- [ ] Reducir `611 warnings` repo-wide a un conjunto pequeno y aceptado.
- [ ] Cerrar deuda historica por lotes, sin reabrir el diff limpio actual.

## Latest Repo-Wide Measurement

Corrida actualizada sobre snapshot local sin `.git`, despues del cierre completo del diff actual:

- [x] `104 errors`
- [x] `554 warnings`
- [x] `343/2523` archivos con hallazgos
- [x] Mejora contra baseline: `-68 errors` y `-57 warnings`
- [x] Diagnostico actual: `C:\Users\jonat\AppData\Local\Temp\react-doctor-79826dfb-e8f6-471f-8c50-5ab3606dfab1`

## Latest Diff Measurement

- [x] `react-doctor --diff`
- [x] `100/100`
- [x] `0 errors`
- [x] `0 warnings`
- [x] `npm run build` pasando despues del ultimo lote

## Goal

Llevar el repo completo a un estado donde React Doctor no reporte errores y donde los warnings restantes sean pocos, conocidos y priorizados. La prioridad no es “hacerlo perfecto” en una sola pasada, sino vaciar primero los problemas que bloquean React Compiler, correctness y accesibilidad.

## Principles

- [ ] Resolver primero `errors`, luego `warnings`.
- [ ] Atacar patrones repetidos por lotes, no archivo por archivo sin estrategia.
- [ ] Mantener cada lote pequeño y validable.
- [ ] Mover orquestación fuera de componentes grandes hacia `hooks/`, `utils/` y subcomponentes locales.
- [ ] No usar `eslint-disable` salvo caso excepcional y documentado.

## Main Workstreams

### 1. React Compiler Blockers

Impacto actual:

- [ ] `153` errores por `try/catch/finally` y patrones que el compilador no puede optimizar.

Patrón dominante:

- [ ] `try/catch/finally` dentro de componentes, hooks y handlers que todavía viven demasiado cerca del render.

Acción:

- [ ] Extraer flujos async a `utils/` o `services/`.
- [ ] Dejar en componentes solo invocación, estado UI y render.
- [ ] Priorizar archivos con más repeticiones por módulo: inventario, modales, settings, ventas, dev tools.

Salida esperada:

- [ ] `0` errores de React Compiler por `try/finally`.

### 2. State and Effects Correctness

Impacto actual:

- [ ] `1` error serio de `setState` sincrónico en effect en `src/modules/sales/pages/Sale/Sale.tsx`
- [ ] `5` hallazgos de estado derivado en `useEffect`
- [ ] `32` hallazgos de effects usados como event handlers
- [ ] `40` hallazgos de múltiples `setState` dentro del mismo effect

Acción:

- [ ] Corregir primero `Sale.tsx`.
- [ ] Sustituir estado derivado por valores calculados en render.
- [ ] Mover lógica disparada por interacción a `onClick`, `onChange`, `onSubmit`.
- [ ] Donde haya varios updates coordinados, usar `useReducer`.

Salida esperada:

- [ ] `0` errores y warnings críticos de effects mal usados.

### 3. Component Architecture

Impacto actual:

- [ ] `45` componentes gigantes
- [ ] `29` warnings de `prefer-useReducer`
- [ ] `47` inline render functions
- [ ] `8` componentes definidos dentro de otros componentes

Acción:

- [ ] Priorizar componentes que además concentran reglas de estado, compiler o a11y.
- [ ] Partir por secciones visibles y responsabilidades: toolbar/header, body/content, modales auxiliares, controladores/view-models.
- [ ] Sacar render functions a subcomponentes nombrados.
- [ ] Sacar componentes anidados a module scope o archivos propios.

Salida esperada:

- [ ] Componentes con responsabilidades más pequeñas y warning count mucho menor en arquitectura.

### 4. Performance and Stability

Impacto actual:

- [ ] `132` defaults con `[]` o referencias nuevas por render
- [ ] `41` hallazgos por `react-chartjs-2` sin lazy loading
- [ ] `5` stale closures por updates no funcionales
- [ ] `9` `useMemo` triviales
- [ ] `4` inicializadores costosos en `useState(...)`
- [ ] `1` listener `scroll` sin `passive: true`

Acción:

- [ ] Reemplazar defaults inline por constantes de módulo.
- [ ] Cargar charts con `React.lazy`.
- [ ] Cambiar updates a forma funcional.
- [ ] Eliminar `useMemo` baratos.
- [ ] Hacer lazy init en `useState(() => value)`.

Salida esperada:

- [ ] Menos ruido transversal y menos rerenders accidentales.

### 5. Accessibility and UX Safety

Impacto actual:

- [ ] `14` labels sin asociación
- [ ] `11` elementos clicables sin soporte de teclado
- [ ] `11` elementos estáticos con handlers sin `role`
- [ ] `9` usos de `autoFocus`
- [ ] `1` proyecto sin estrategia explícita de reduced motion
- [ ] `1` uso de `dangerouslySetInnerHTML`

Acción:

- [ ] Resolver primero formularios y selectores más usados.
- [ ] Reemplazar `div` clicables por `button` cuando aplique.
- [ ] Agregar `htmlFor` e `id`.
- [ ] Eliminar `autoFocus` salvo necesidad real.
- [ ] Definir estrategia base de `prefers-reduced-motion`.
- [ ] Revisar si `dangerouslySetInnerHTML` puede eliminarse o sanitizarse mejor.

Salida esperada:

- [ ] Accesibilidad base consistente y menos riesgo de regresiones UX.

## Execution Phases

### Phase 1. Compiler and Correctness

Objetivo:

- [ ] Bajar todos los `errors` que hoy bloquean React Compiler y correctness.

Incluye:

- [ ] `try/catch/finally`
- [ ] `setState` en effects
- [ ] estado derivado en effects
- [ ] effects usados como handlers

Definición de terminado:

- [ ] `0 errors` en React Doctor repo-wide.

### Phase 2. Shared Pattern Cleanup

Objetivo:

- [ ] Vaciar reglas repetidas que aparecen en docenas de archivos.

Incluye:

- [ ] default arrays/objects inline
- [ ] stale closures
- [ ] `useMemo` triviales
- [ ] lazy init en `useState`

Definición de terminado:

- [ ] Las reglas transversales de bajo riesgo quedan reducidas drásticamente.

### Phase 3. Architecture Refactors

Objetivo:

- [ ] Reducir componentes gigantes y consolidar estado relacionado.

Incluye:

- [ ] `no-giant-component`
- [ ] `prefer-useReducer`
- [ ] nested components
- [ ] inline render functions

Definición de terminado:

- [ ] Los hotspots principales quedan partidos en controladores, hooks y subcomponentes locales.

### Phase 4. Accessibility and Motion

Objetivo:

- [ ] Resolver problemas de a11y y motion con criterio transversal.

Incluye:

- [ ] labels
- [ ] keyboard support
- [ ] roles
- [ ] `autoFocus`
- [ ] reduced motion

Definición de terminado:

- [ ] Las reglas de accesibilidad dejan de ser una fuente grande de warnings.

### Phase 5. Bundle and Runtime Performance

Objetivo:

- [ ] Atacar el peso y costo de runtime de librerías y animaciones.

Incluye:

- [ ] `react-chartjs-2` con lazy loading
- [ ] motion imports
- [ ] animaciones sobre layout properties

Definición de terminado:

- [ ] Menor warning count y mejor perfil de carga.

## Immediate Next Batch

Objetivo del siguiente lote:

- [x] Resolver el error de `setState` sincronico en `src/modules/sales/pages/Sale/Sale.tsx`.
- [x] Revisar el mismo archivo para estado derivado y effects usados como handlers.
- [x] Ejecutar `npm run lint -- path src/modules/sales/pages/Sale/Sale.tsx`.
- [x] Ejecutar `npm run build`.
- [x] Ejecutar React Doctor sobre el diff.

Si ese lote queda limpio, seguir con:

- [x] `src/components/modals/*` con errores de compiler.
- [x] `src/components/ui/*` con errores de compiler.
- [x] `src/modules/settings/components/GeneralConfig/configs/*`.
- [x] `src/modules/inventory/**/*` del diff actual con `try/catch` y value blocks dentro de componentes.
- [ ] `src/modules/dev/**/*` con errores de compiler todavia pendientes a nivel repo-wide.
- [ ] `src/modules/orderAndPurchase/**/*` fuera del diff actual.

## Suggested Batch Order

Orden recomendado de lotes:

- [ ] `src/modules/sales/pages/Sale/Sale.tsx`
- [ ] `src/components/modals/*` y `src/components/ui/*` con errores de compiler
- [ ] `src/modules/settings/components/GeneralConfig/configs/*`
- [ ] `src/modules/inventory/**/*`
- [ ] `src/modules/orderAndPurchase/**/*`
- [ ] `src/modules/utility/**/*` y charts
- [ ] accesibilidad transversal

Tamaño recomendado de lote:

- [ ] `10` a `25` archivos por batch si el patrón es repetitivo
- [ ] `1` a `5` archivos si hay refactor estructural fuerte

## Validation Protocol

Después de cada batch:

```powershell
npm run lint -- path <rutas tocadas>
npm run build
npx -y react-doctor@latest . --verbose --diff
```

Al cierre de cada fase:

```powershell
npx -y react-doctor@latest . --verbose --yes --project ventamax
```

Nota:

- [ ] Para evitar que el CLI mezcle resultados con la rama base, correr el escaneo total sobre un snapshot local sin `.git`, igual que en este baseline.

## Success Criteria

- [ ] `0 errors` repo-wide.
- [ ] Warnings reducidos a un bloque pequeño y explícitamente aceptado.
- [ ] Los módulos críticos de ventas, inventario, settings y modales quedan con arquitectura mantenible.
- [ ] El diff de cualquier trabajo nuevo sigue quedando limpio en React Doctor.
- [ ] Cada fase cerrada queda reflejada actualizando este checklist.
- [x] Cada fase del diff actual ya quedo reflejada en este checklist.

## Non-Goals

- [ ] No reescribir módulos completos solo por estilo.
- [ ] No mezclar este trabajo con features de negocio nuevas.
- [ ] No tocar flujos sensibles sin validación puntual de build y lint.
