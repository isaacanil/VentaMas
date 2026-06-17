# UI/UX Consistency Autofix Plan

Fecha: 2026-05-05
Repo: `C:\Dev\VentaMas`
Modo: auditoria autonoma con cambios seguros, sin deploy, sin push, sin tocar produccion.

## Alcance Verificado

- Navegacion principal: `src/router/routes/routesName.ts`, `src/router/routes/routePreloaders.ts`, rutas por modulo en `src/router/routes/paths`.
- Componentes compartidos: `src/components/common/DatePicker`, `src/components/ui`, `src/design-system`.
- Pantallas operativas: accounting workspace, sales analytics, cash reconciliation, app error surfaces, navigation menu.
- Estados revisados por codigo: loading, empty, error, disabled, permission denied, acciones primarias/secundarias, modales/drawers/tablas/forms.
- Herramientas: SCIP local (`ventamas-root`, `ventamas-functions`), busqueda por codigo, diff review, `npm run typecheck:app`.

## Hallazgos Priorizados

| Prioridad | Problema                                                                                                                    | Evidencia                                                                                                              | Archivos afectados                                                                   | Cambio seguro propuesto                                                              | Estado      |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ----------- |
| P0        | Typecheck global no esta verde; hay deuda amplia no limitada a UI.                                                          | `npm run typecheck:app` falla con errores en availability, firebase, ventas, settings, treasury, router, utility, etc. | Varias areas del repo                                                                | No mezclar reparacion masiva con UI pass. Registrar bloqueo y usar checks dirigidos. | BLOQUEADO   |
| P0        | Worktree ya estaba sucio antes de esta pasada. Riesgo de atribuir cambios ajenos.                                           | `git status --short` muestra cambios previos en 30+ archivos y docs/audits.                                            | Varias areas                                                                         | No revertir. Tocar solo archivos con mejora UI/UX segura y documentar.               | BLOQUEADO   |
| P1        | Pantallas operativas mezclan tokens `--ds-*` con variables legacy (`--white`, `--black-3`, `--gray-*`) y colores hardcoded. | Busqueda en `src/modules` y `src/components` detecta uso masivo de `#...`, `rgb(...)`, `rgba(...)`.                    | Welcome, inventory, invoice analytics, app error surfaces, components legacy         | Retokenizar solo superficies tocadas; dejar migracion masiva para plan de DS.        | EN PROGRESO |
| P1        | Estados vacios/loading en analiticas de ventas existen, pero usan contenedor visual legacy y copy largo.                    | `SalesAnalyticsPanel.tsx` tiene loading y empty state propios.                                                         | `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/SalesAnalyticsPanel.tsx` | Reforzar tokens DS, copy mas escaneable y contenedor coherente.                      | APLICADO    |
| P1        | Resumen y breakdown de analiticas usan bordes/colores hardcoded.                                                            | `OverviewStrip.tsx`, `BreakdownList.tsx`, `SalesTrendSection.tsx`.                                                     | Sales analytics components                                                           | Cambiar a tokens DS sin tocar calculos.                                              | APLICADO    |
| P2        | Pantalla 404 usa copy generico y colores hardcoded.                                                                         | `src/modules/app/pages/NotFound/NotFound.tsx`.                                                                         | `NotFound.tsx`                                                                       | Tokens DS, mejor jerarquia, CTA claro.                                               | APLICADO    |
| P2        | Error surfaces tienen dos patrones: route fallback Ant Result y ErrorElement HeroUI.                                        | `RouteErrorFallback.tsx`, `ErrorElement/*`, `ErrorReports`.                                                            | App error pages                                                                      | Mantener cambio bloqueado hasta prueba visual; no expandir migracion.                | BLOQUEADO   |
| P2        | Accounting manual entries y general ledger estan en migracion HeroUI.                                                       | Diff actual en `ManualEntriesPanel.tsx`, `GeneralLedgerToolbar.tsx`.                                                   | Accounting workspace                                                                 | No tocar logica contable/fiscal; validar por build/lint/tests.                       | BLOQUEADO   |
| P3        | Welcome/landing tiene deuda visual alta, pero es una superficie amplia y no operativa.                                      | Busqueda de hardcoded colors en `src/modules/welcome`.                                                                 | Welcome V1/V2                                                                        | Requiere decision de diseno; no auto-fix en esta pasada.                             | BLOQUEADO   |

## Cambios Seguros Aplicados

- Sales analytics:
  - Retoken de contenedores, bordes, texto secundario, barras y estado loading/empty.
  - Copy de estado loading/empty mas directo.
  - Sin cambios en calculos, filtros, datos ni acciones.
- NotFound:
  - Retoken visual completo con `--ds-*`.
  - Copy mas claro: ruta no encontrada o movida.
  - CTA mantiene ruta `HOME`.

## State Matrix

| Estado            | Hallazgo                                                                                     | Resultado            |
| ----------------- | -------------------------------------------------------------------------------------------- | -------------------- |
| Loading           | Analiticas de ventas muestra estado, pero copy y visual eran legacy.                         | Mejorado localmente. |
| Empty             | Analiticas de ventas y 404 existian; 404 no era estado operativo claro.                      | Mejorado localmente. |
| Error             | ErrorElement/RouteErrorFallback existen, pero migracion y stack visibility requieren prueba. | BLOQUEADO.           |
| Success           | No se altero.                                                                                | Sin cambio.          |
| Dirty             | Forms contables tienen estado de borrador/guardar; no se cambio por riesgo de flujo.         | BLOQUEADO.           |
| Disabled          | Buttons HeroUI/Ant mezclados; no hay fix masivo seguro.                                      | BLOQUEADO.           |
| Read-only         | DatePicker y campos contables existen; no se cambio semantica.                               | Sin cambio.          |
| Permission denied | Route fallback cubre 401/403, BusinessSelector cubre sin permisos.                           | Sin cambio.          |

## Verificacion Ejecutada

| Comando                                                                                                                 | Resultado                 | Evidencia                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck:app`                                                                                                 | Falla global.             | Primeros bloqueos visibles: `FrontendFeatureRouteGate.tsx` por feature missing, `LazyCharts.tsx` por assignability, multiples imports de Ant icons y errores existentes en Firebase/payments/router/settings. |
| `npm run lint`                                                                                                          | Falla por uso incorrecto. | `tools/lint.js` exige target explicito; imprime usage y sale con codigo 1.                                                                                                                                    |
| `npm run lint:fast`                                                                                                     | Pasa.                     | `oxlint src functions/src -f stylish`: 0 errores, 224 warnings existentes.                                                                                                                                    |
| `npm run lint -- path ...`                                                                                              | Bloqueado.                | ESLint target sobre archivos tocados quedo colgado sin salida nueva; proceso local terminado para no dejar sesion abierta.                                                                                    |
| `npm run test:run`                                                                                                      | No concluyente.           | Suite global mostro fallo inicial en `SalesAnalyticsPanel/analyticsSummary.test.ts` y luego no cerro; se termino el proceso. El mismo test paso aislado.                                                      |
| `npx vitest run src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.test.ts --reporter verbose` | Pasa.                     | 1 archivo, 1 test, 11.23s.                                                                                                                                                                                    |
| `npm run build`                                                                                                         | Pasa.                     | Vite build completo: 7985 modules, chunks grandes existentes, built in 4m 49s.                                                                                                                                |

## Proximos Pasos

1. Separar deuda de typecheck global de deuda UI; no usar este pass para arreglarla toda.
2. Hacer QA visual con browser en `/bills/analytics`, ruta 404 y accounting workspace cuando auth/local stack este disponible.
3. Definir si ErrorElement debe auto-reportar o pedir confirmacion; esto toca telemetria y no es solo UI.
4. Planificar migracion DS de colores hardcoded por modulo, empezando por pantallas operativas antes de landing.
