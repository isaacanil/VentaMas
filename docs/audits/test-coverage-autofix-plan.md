# Test coverage autofix plan

Fecha: 2026-05-05
Repo: `C:\Dev\VentaMas`
Modo: sesion autonoma segura, sin deploy, sin push, sin migraciones, sin datos reales.

## Objetivo

Subir cobertura contra regresiones sin cambiar comportamiento productivo. Prioridad: logica critica, hooks, utils, servicios, mappers, validaciones, funciones contables/financieras, rutas protegidas, permisos, calculos, formateadores, estados y casos borde.

## Inspeccion inicial

- `package.json` expone `test:run`, `test:run:functions`, `test:run:all`, `typecheck`, `typecheck:dev`, `lint`, `lint:fast`, `lint:web`, `lint:all`, `build`.
- Vitest frontend usa `vitest.config.ts`, ambiente `jsdom`, include `src/**/*.{test,spec}.?(c|m)[jt]s?(x)`.
- Vitest functions usa `vitest.functions.config.ts`, ambiente `node`, include `functions/src/**/*.{test,spec}.{js,ts}`.
- Reportes previos revisados:
  - `plans/testing/2026-03-17-testing-plan.md`
  - `plans/testing/runs/2026-04-23-finanzas-contabilidad-vitest.md`
  - `plans/architecture/2026-03-03-contabilidad-design/2026-04-22-auditoria-qa-finanzas-contabilidad-vitest.md`
  - `docs/audits/accounting-finance-autofix.md`
  - `docs/audits/code-quality-autofix-plan.md`
- Worktree ya estaba sucio al iniciar. No se revierte nada.

## Prioridad

| Prioridad | Area | Criterio | Decision |
| --- | --- | --- | --- |
| P0 | Contabilidad/finanzas functions | Dinero, asientos, caja, CxC/CxP, anulaciones | Cubrir con tests unitarios deterministas. |
| P0 | Permisos/rutas protegidas | Bloqueos por host, feature, rol, menu/ruta | Cubrir catalogos/guards puros; evitar montar app completa. |
| P1 | Import/mappers | Carga masiva de productos y normalizacion de encabezados | Cubrir aliases, nested paths, trim, transforms y errores. |
| P1 | CxC calculos/orden | Orden y limites de cuotas afectan cobros | Cubrir sort, timestamps y defaults. |
| P1 | Hooks/servicios con Firestore | Riesgo alto pero mocks fragiles | Solo ampliar si test queda pequeno y aislado. |
| P2 | Formateadores/graficos | Alto valor visual, bajo riesgo | Cubrir helpers puros locales cuando existan. |
| Bloqueado | Flujos browser/e2e con datos | Requiere auth/emulador estable o decision operativa | Documentar, no crear datos. |

## Plan de implementacion seguro

1. Agregar tests frontend pequenos para utils puros:
   - `src/utils/import/mapData.test.ts`
   - `src/utils/import/processMappedData.test.ts`
   - `src/modules/accountsReceivable/utils/sortAccountsReceivable.test.ts`
   - `src/domain/accountsReceivable/getMaxInstallments.test.ts`
2. Agregar test de permisos sin Firestore real:
   - `src/domain/permissions/dynamicPermissionsCatalog.test.ts`
3. Agregar test functions directo para auditoria de caja:
   - `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.test.js`
4. Ejecutar validaciones enfocadas primero.
5. Ejecutar gates disponibles: `test:run`, `test:run:functions`, `typecheck`, `lint`/`lint:fast`, `build`.
6. Documentar bug real si aparece; corregir solo si cambio es seguro y no requiere criterio de negocio.

## Complejidad

Complejidad esencial baja: tests nuevos observan contratos existentes. Complejidad accidental evitada: sin refactor global, sin mocks de app completa, sin snapshots visuales, sin cambios de config productiva.

## Tests agregados

### Frontend

- `src/utils/import/mapData.test.ts`
  - aliases en espanol (`Codigo`, `Facturable`)
  - normalizacion de headers
  - trim de strings
  - escritura de paths anidados
  - valores `Date`/objetos
  - idioma sin mapping
  - coercion de valores no soportados
- `src/utils/import/processMappedData.test.ts`
  - transforms secuenciales
  - lectura desde `source` y escritura a otro path
  - error de transform aislado sin romper la fila
- `src/modules/accountsReceivable/utils/sortAccountsReceivable.test.ts`
  - no mutar arreglo original
  - orden numerico de facturas
  - fechas `Date`, `seconds`, `toMillis`
  - balances con faltantes como cero
- `src/domain/accountsReceivable/getMaxInstallments.test.ts`
  - limites `monthly`, `weekly`
  - fallback para frecuencias desconocidas
- `src/domain/permissions/dynamicPermissionsCatalog.test.ts`
  - permisos disponibles por rol
  - roles desconocidos/legacy sin fuga de permisos de cajero
  - resumen de conteos/categorias

### Functions

- `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.test.js`
  - auditoria de caja netea `receivable_payment_void` como salida negativa al recalcular discrepancias.

### Tests existentes estabilizados

- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/hooks/usePaymentsForCashCount.test.ts`
- `src/utils/expenses/payment.test.ts`
- `src/features/cart/utils/updateAllTotals.test.ts`
- `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.test.ts`
- `src/router/routes/routeVisibility.test.ts`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/ProductsTable.test.tsx`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/PurchaseReceiptForm/components/ReceiptHistorySection/ReceiptHistorySection.test.tsx`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesReport/reports/MonthlyAndAccumulatedPurchaseCharts/utils/accumulatePurchaseData.test.ts`
- `functions/src/app/modules/treasury/functions/createInternalTransfer.test.js`
- `functions/src/app/modules/compliance/services/dgiiMonthlyReportValidation.service.test.js`

## Bugs encontrados

- `buildSalesAnalyticsSummary` calculaba cualquier rango con mas de un timestamp como minimo 2 dias por `Math.ceil(diffDays) + 1`; ventas del mismo dia caian en grupo `day` en vez de `hour`. Corregido en `analyticsSummary.ts`.
- El label del bucket horario mostraba el minuto de la primera venta (`09:15`) en vez del inicio de hora (`09:00`). Corregido en `analyticsSummary.ts`.
- Full frontend test con pool default (`threads`) reporto fallos reales ya corregidos y luego timeouts de workers. La suite quedo verde usando `--pool forks --maxWorkers 1`, que es el modo estable observado para este repo en Windows.

## Cambios aplicados

- Solo tests nuevos para mappers/import, CxC sort/limites, permisos dinamicos y auditoria de caja.
- Fix seguro en `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.ts`.
- Ajustes de tests existentes por contratos actuales:
  - `credit_card` normaliza a `card`.
  - `normalizeExpensePayment` limpia `cashAccountId`.
  - `updateAllTotals` depende de `settings.fiscal.taxationEnabled`.
  - fixture de compras evita frontera UTC/local.
  - fixture de transferencia interna fija `occurredAt` dentro del periodo cerrado.
  - validacion DGII 607 ahora declara `thirdPartyWithholdings` como source canonico sin `pendingGaps`.
  - `routeVisibility.test.ts` evita `vi.resetModules()` por costo alto en suite completa.
  - tests TSX pesados recibieron timeout explicito.
- Fix de tipo local en `src/router/routes/routeVisibility.ts` para `matchRoutes`.
- No deploy.
- No push.
- No migraciones.
- No datos reales.

## Validaciones

### Pasaron

```powershell
npm run test:run -- src/domain/accountsReceivable/getMaxInstallments.test.ts src/utils/import/mapData.test.ts src/utils/import/processMappedData.test.ts src/modules/accountsReceivable/utils/sortAccountsReceivable.test.ts src/domain/permissions/dynamicPermissionsCatalog.test.ts
```

Resultado: `5 passed files`, `16 passed tests`.

```powershell
npm run test:run:functions -- functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.test.js
```

Resultado: `1 passed file`, `1 passed test`.

```powershell
npm run test:run:functions
```

Resultado: `62 passed files`, `230 passed tests`.

```powershell
npm run test:run -- --pool forks --maxWorkers 1
```

Resultado: `96 passed files`, `357 passed tests`.

```powershell
npm run lint:fast
```

Resultado: `0 errors`, `224 warnings`.

```powershell
npm run build
```

Resultado: build paso. Warnings: chunks mayores de `1600 kB`.

### Fallo no bloqueante por herramienta

```powershell
npm run lint
```

Resultado: exit `1`, imprime usage de `tools/lint.js` porque el script requiere target concreto. Se ejecuto `npm run lint:fast` como target valido.

### Fallo global existente

```powershell
npm run typecheck
```

Resultado: exit `1`. TypeScript falla por deuda global amplia, no acotada a los tests nuevos. Primeras familias vistas:

- `FrontendFeatureRouteGate.tsx`: falta config para `invoiceTemplateV2Beta`.
- Varios imports de `@ant-design/icons` no existen para la version instalada.
- Errores de tipos en Firestore, productos, CxC, compras, settings, rutas y styled-components.
- `src/router/routes/routeVisibility.ts` aparecio en el primer output y fue corregido con cast local para `matchRoutes`.

## Errores restantes

- `npm run typecheck` sigue rojo por deuda TypeScript global. Requiere ciclo dedicado; no es seguro arreglarlo completo dentro de esta sesion de cobertura.
- `npm run lint` sin target sigue devolviendo usage/exit `1`; usar `lint:fast`, `lint:web`, `lint:all`, `lint:styles` o `npm run lint -- <target>`.
- `lint:fast` mantiene `224 warnings` preexistentes.
- `build` mantiene warnings de chunk grande.

## Proximos pasos

1. Crear ciclo exclusivo para `npm run typecheck`, empezando por `FrontendFeatureRouteGate`, exports de `@ant-design/icons`, `routes.tsx` y tipos de pagos/CxC.
2. Decidir si `npm run lint` debe defaultar a `fast` o si se mantiene como comando de ayuda.
3. Agregar test directo para `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.js` con tarjetas/transferencias y gastos, no solo voids CxC.
4. Cubrir importacion de productos con `transformConfig` real de `product/transformFunctions.ts`.
5. Ejecutar browser smoke autenticado solo cuando emulador/auth esten listos; no se toco datos en esta sesion.
