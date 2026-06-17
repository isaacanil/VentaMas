# Code quality autofix plan

Fecha: 2026-05-05
Repo: `C:\Dev\VentaMas`
Modo: sesion autonoma segura, sin deploy, sin push, sin migraciones, sin datos reales.

## Resumen ejecutivo

Objetivo: detectar codigo repetido, logica redundante, utilidades duplicadas, componentes grandes, hooks extensos y oportunidades seguras de centralizacion/modularizacion.

Estado inicial observado:

- Worktree ya estaba sucio antes de este plan. Cambios existentes incluyen rutas/devtools de errores, cash count, accounting posting profiles, typecheck/lint scripts y docs/audits contables. No se revierte nada.
- `package.json` expone validaciones utiles: `lint`, `lint:fast`, `lint:web`, `lint:all`, `lint:styles`, `test:run`, `test:run:functions`, `test:run:all`, `typecheck`, `typecheck:app`, `typecheck:dev`, `build`, `format`.
- Archivos mas grandes detectados en `src`: `FiscalCompliancePanel.tsx` (1828), `arPaymentUtils.ts` (1491), `BusinessSelectorPage.tsx` (1291), `CashCountAudit.tsx` (1192), `clients.ts` (1172), `DeveloperSubscriptionMaintenancePlansPage.tsx` (1172), `executeCommand.ts` (1151), `FiscalReceiptsAlertSettings.tsx` (1137), `useAccountingConfig.ts` (1132), `accountingWorkspace.ts` (1049).
- Guardrail aplicado: no tocar logica fiscal/contable delicada ni cambios con riesgo de comportamiento sin cobertura clara.

## Patrones repetidos detectados

| Prioridad | Patron | Archivos candidatos | Decision |
| --- | --- | --- | --- |
| Alta | Formateo local de fechas para graficos de ventas repetido por componente | `DailySalesBarChart.tsx`, `DiscountsGivenBarChart.tsx`, `TaxedSalesStackedBarChart.tsx` | Seguro: mover a utility local de `SalesAnalyticsPanel`, misma salida, validable con typecheck/build. |
| Alta | Calculo de rango temporal `min/max` repetido en graficos de ventas | `DiscountsGivenBarChart.tsx`, `TaxedSalesStackedBarChart.tsx`, parte de `DailySalesBarChart.tsx` | Seguro si se centraliza en helper puro local con tests pequenos. |
| Media | Componentes devtools grandes con UI + data + export mezclados | `CashCountAudit.tsx`, `HeroUiPlayground.tsx`, `InvoiceV2Recovery` | Bloqueado para autofix corto: cambios visibles amplios, poca cobertura visual en esta sesion. |
| Media | Formateadores de moneda/numero dispersos | `SalesAnalyticsPanel`, `PurchasesReport`, `InventorySummary`, `MultiPaymentModal` | Parcialmente bloqueado: locale/moneda puede ser decision de dominio; solo centralizar si scope local conserva salida exacta. |
| Media | Error screen ya modularizado parcialmente en worktree sucio | `ErrorElement`, `ErrorCard`, `ErrorDetails`, `useErrorHandling` | No tocar salvo validacion/typecheck, porque cambios ya existian al iniciar. |
| Baja | Archivos de config/rutas grandes por registro explicito | `Setting.tsx`, `routePreloaders.ts`, `routesName.ts` | Bloqueado: fragmentar puede reducir lineas pero aumentar acoplamiento si no hay criterio de ownership. |

## Ciclo 1 planeado

1. Crear utility local de graficos de ventas para:
   - `formatSalesChartDate(seconds, format)`
   - `getSalesDateSpan(sales)`
   - `shouldGroupSalesByMonth(sales)`
2. Reemplazar duplicacion en `DiscountsGivenBarChart.tsx` y `TaxedSalesStackedBarChart.tsx`.
3. Reutilizar `formatSalesChartDate` en `DailySalesBarChart.tsx` sin cambiar controles ni datasets.
4. Agregar test unitario local para helper puro.
5. Ejecutar validaciones relevantes: test del helper, `typecheck:app`, `lint:web` o `lint:fast`, y `build` si typecheck pasa.

Complejidad: esencial baja. Se reduce duplicacion local sin crear abstraccion global prematura.

## Ciclo 2 aplicado

1. Extraer helpers puros de periodo local:
   - `getSalesPeriodKey(date, periodType)`
   - `formatSalesPeriodDisplay(period, periodType)`
   - `getAvailableSalesPeriods(sales, periodType)`
   - `filterSalesByPeriod(sales, period, periodType)`
2. Reemplazar helpers inline en `DailySalesBarChart.tsx`.
3. Mantener semantica existente del periodo mensual con mes base cero (`marzo 2026` => `2026-02`).
4. Cubrir esa semantica con test para evitar cambio accidental.

Complejidad: esencial baja. Se quita duplicacion/localismo del componente sin mover reglas a capa global.

## Bloqueados

### BLOQUEADO: partir `FiscalCompliancePanel.tsx`

Archivo grande, pero fiscal/compliance es zona critica y puede cambiar comportamiento/reportes. Requiere decision de arquitectura y validacion funcional especifica.

### BLOQUEADO: partir `arPaymentUtils.ts`

Archivo grande con pagos CxC. Riesgo financiero alto. No seguro sin pruebas exhaustivas de pagos/anulaciones.

### BLOQUEADO: unificar formateadores globales de moneda/fecha

Hay muchos formateadores, pero no todos comparten locale, precision, moneda ni contexto (UI, PDF, export, fiscal). Centralizacion global podria cambiar salida.

### BLOQUEADO: modularizar rutas/settings masivamente

Puede parecer limpieza, pero afecta lazy imports, gates, preloaders y permisos. No seguro como autofix amplio.

## Cambios aplicados

### Archivos modificados por esta sesion

Nota de estado actual (2026-06-17): esta seccion conserva el registro
historico del autofix. Los componentes bajo `SalesAnalyticsPanel/components/Bars`
ya no existen; el codigo vivo quedo reorganizado en `utils.ts`, `utils.test.ts`
y componentes nombrados como `OverviewStrip`, `SalesTrendSection`,
`CategoryPerformanceBoard` y `TopCustomersBoard`.

- `docs/audits/code-quality-autofix-plan.md`
- `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/utils.ts`
- `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/utils.test.ts`
- `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/components/Bars/DailySalesBarChart/DailySalesBarChart.tsx`
- `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/components/Bars/DiscountsGivenBarChart/DiscountsGivenBarChart.tsx`
- `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/components/Bars/TaxedSalesStackedBarChart/TaxedSalesStackedBarChart.tsx`

### Duplicacion removida

- Formateo local de fecha de graficos eliminado de 3 componentes.
- Calculo repetido de span temporal eliminado de 3 componentes.
- Helpers inline de periodo removidos de `DailySalesBarChart.tsx`.
- Date/period logic quedo centralizada solo dentro del modulo `SalesAnalyticsPanel`, no global.

### Modularizacion

- `utils.ts` crecio como utility local del panel, reutilizando utilidades existentes:
  - `formatLocaleDate`
  - `formatLocaleMonthYear`
  - `getInvoiceDateSeconds`
- `DailySalesBarChart.tsx` bajo de logica propia duplicada y delega periodos/fechas al utility local.
- `DiscountsGivenBarChart.tsx` y `TaxedSalesStackedBarChart.tsx` conservan solo acumulacion propia del dataset.

No se tocaron `functions/`, migraciones, configuracion productiva, fiscal/compliance ni accounting core.

## Validaciones

| Comando PowerShell | Resultado |
| --- | --- |
| `npm run test:run -- src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/utils.test.ts` | OK. 4 tests pasan. |
| `npm run lint:fast` | OK. 0 errores, 224 warnings repo-wide existentes. |
| `node .\node_modules\eslint\bin\eslint.js --no-cache --ext js,jsx,ts,tsx src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/utils.ts src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/utils.test.ts src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/components/Bars/DailySalesBarChart/DailySalesBarChart.tsx src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/components/Bars/DiscountsGivenBarChart/DiscountsGivenBarChart.tsx src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/components/Bars/TaxedSalesStackedBarChart/TaxedSalesStackedBarChart.tsx` | OK. Sin salida. |
| `npm run build` | OK. Build Vite completo pasa. Queda warning de chunks mayores a 1600 kB. |
| `npm run typecheck` | Falla por errores globales existentes en `typecheck:app`; no hubo matches al filtrar por archivos tocados de `SalesAnalyticsPanel`. |
| `npm run typecheck:dev` | Falla por deuda global de tipos existente. |
| `git diff --check -- docs/audits/code-quality-autofix-plan.md src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel` | OK. Sin errores de whitespace; Git solo avisa normalizacion futura LF -> CRLF en archivos TS/TSX tocados. |

Nota: `npm run lint -- <archivos>` quedo colgado en una corrida inicial y fue terminado. Se valido el mismo scope con ESLint directo.

## Resultados y riesgos pendientes

### Resultado

- Cambio acotado y local.
- Comportamiento visible esperado: sin cambio funcional.
- Tests nuevos cubren fechas, span, agrupacion mensual y periodos.
- Build pasa.
- Lint de archivos tocados pasa.
- Diff revisado: cambios limitados a `SalesAnalyticsPanel` y reporte de auditoria.

### Errores restantes

- `typecheck` global sigue rojo por errores no originados por esta sesion. Categorias vistas:
  - exports faltantes como `invoiceTemplateV2Beta`
  - tipos de `@ant-design/icons`
  - incompatibilidades de `styled-components`/theme
  - errores en purchases, AR, accounting y fiscal
  - errores de JSX namespace en dependencias dev
- `lint:fast` mantiene 224 warnings repo-wide, 0 errores.
- `build` mantiene warning de chunks grandes.

### Riesgos

- La clave mensual existente usa mes base cero. Se preservo para no cambiar comportamiento, pero puede ser deuda funcional si el producto espera `2026-03` para marzo.
- La centralizacion quedo local a `SalesAnalyticsPanel`; otros reportes pueden tener duplicacion similar no tocada.
- No hubo prueba visual/browser de graficos; validacion fue fuente/test/build.

### Segunda revision priorizada

1. Definir baseline para `typecheck`: separar errores existentes por owner o volver verde `typecheck:app`.
2. Resolver wrapper/tipos de `@ant-design/icons`; impacta varias rutas y previews.
3. Tipar shapes de uploads/pagos en purchases y AR antes de tocar utilidades financieras grandes.
4. Revisar fiscal/compliance con plan dedicado y pruebas especificas, no como autofix generico.
5. Evaluar code splitting de vendors grandes (`pdfmake`, `exceljs`, chunks principales) por warning de build.
6. Reducir warnings de `lint:fast` por grupo mecanico validable.
