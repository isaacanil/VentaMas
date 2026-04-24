# Corrida QA finanzas y contabilidad - Vitest

Fecha: `2026-04-23`

Estado: `PASSED_AUTOMATED`

Alcance:

- backend/functions: contabilidad, CxC, CxP, compras, tesoreria, gastos, proyector contable v2
- frontend/unit/component: accounting workspace, CxP, tesoreria, invoice panel, settings contables, helpers contables, compras, gastos, caja

## Comandos ejecutados

```powershell
npx vitest run --config vitest.functions.config.ts functions/src/app/modules/accounting functions/src/app/modules/accountReceivable functions/src/app/modules/purchase functions/src/app/modules/treasury functions/src/app/modules/expenses functions/src/app/versions/v2/accounting
```

Resultado final:

- `35` test files passed
- `121` tests passed
- duracion: `25.82s`

```powershell
npx vitest run src/modules/accounting src/modules/accountsPayable src/modules/treasury src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel src/modules/settings/components/GeneralConfig/configs/AccountingConfig src/utils/accounting src/utils/accountsReceivable src/utils/payments src/utils/purchase src/utils/vendorBills src/firebase/purchase src/firebase/expenses src/firebase/cashCount src/shared/accountingSchemas.test.ts
```

Resultado final:

- `47` test files passed
- `179` tests passed
- duracion: `211.05s`

## Hallazgos corregidos durante corrida

| Area | Hallazgo | Accion |
| --- | --- | --- |
| Functions accounting replay | Test mockeaba `onCall` como si solo recibiera handler; la funcion real usa firma `onCall(options, handler)`. | Mock actualizado para soportar ambas firmas. |
| Functions CxC services | Tests importaban `firebase-functions` real y se quedaban lentos/timeouts. | Mock local de `https.HttpsError`. |
| Frontend compras | `fbCompletePurchase.test.ts` no mockeaba exports usados por `fbUpsertVendorBill`. | Agregados mocks de `resolvePurchaseDisplayNextPaymentAt` y `deleteDoc`. |
| Frontend settings contables | `useAccountingConfig.test.ts` no mockeaba `where` usado por catalogo bancario. | Agregado mock de `where`. |

## Mapeo contra plan maestro

| ID | Estado | Evidencia | Hallazgo | Accion |
| --- | --- | --- | --- | --- |
| F0-01 | parcial automatizado | `useAccountingConfig.test.ts`, `accountingAudit.test.ts`, `exchangeRateReference.test.ts` | No reemplaza smoke navegador de `/settings/accounting`. | Ejecutar browser smoke. |
| F0-02 | parcial automatizado | `useAccountingWorkspace.test.ts`, `journalBookExport.test.ts`, `accountingNavigation.test.ts` | No valida UI real autenticada. | Ejecutar browser smoke. |
| F0-03 | parcial automatizado | `useAccountingWorkspace.test.ts`, `financialReportsExport.test.ts` | No valida datos reales de mayor. | Ejecutar browser smoke con negocio piloto. |
| F0-05 | parcial automatizado | `accountsPayable.test.ts`, `accountsPayableDashboard.test.ts` | No valida pantalla con datos reales. | Ejecutar browser smoke. |
| V-01/V-10 | cubierto unit/functions | `projectAccountingEventToJournalEntry.test.js`, `accountingReports.util.test.js`, invoice panel tests | Falta prueba navegador creando factura real. | Ejecutar flujo manual/emulador. |
| P-01/P-08 | cubierto unit/functions | `syncPurchaseCommittedAccountingEvent.test.js`, `supplierPaymentLifecycle.test.js`, `fbCompletePurchase.test.ts` | Falta corrida browser compra/pago real. | Ejecutar flujo manual/emulador. |
| T-07/T-09 | cubierto unit/functions | `createInternalTransfer.test.js`, `createBankReconciliation.test.js`, treasury utils tests | Falta validacion visual en `/treasury`. | Ejecutar browser smoke. |
| R-01/R-07 | cubierto unit/frontend | export tests de diario/mayor/reportes | Falta export real con dataset piloto. | Ejecutar export en navegador. |

## Pendiente

- Ejecutar Fase 0 en navegador local con negocio autenticado.
- Registrar IDs reales: documento origen, `accountingEvent`, `journalEntry`, reporte y enlace.
- Probar flujos end-to-end con emulador/datos piloto: venta, compra, cobro CxC, pago CxP, gasto, transferencia, conciliacion.

## Intento browser smoke Fase 0

Estado: `BLOCKED_AUTH`

Comandos / acciones:

```powershell
npm run dev:local
```

Resultado:

- `dev:local` no dejo puertos gestionados listos dentro del timeout.
- Puertos esperados sin listener inicial: `8081`, `9099`, `5001`.
- Vite se levanto aparte en `http://127.0.0.1:5173/`.

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Smoke headless:

| Ruta | Estado | Evidencia | Hallazgo | Accion |
| --- | --- | --- | --- | --- |
| `/settings/accounting` | bloqueado | `200`, redirige a `/` | Sesion no autenticada; muestra landing/login. | Reintentar con usuario piloto autenticado. |
| `/contabilidad/libro-diario` | bloqueado | timeout navegando ruta protegida | Sin sesion/emulador estable. | Reintentar con usuario piloto autenticado. |
| `/contabilidad/libro-mayor` | bloqueado | timeout navegando ruta protegida | Sin sesion/emulador estable. | Reintentar con usuario piloto autenticado. |
| `/contabilidad/reportes` | bloqueado | `200`, sin contenido autenticado | Ruta protegida no validada. | Reintentar con usuario piloto autenticado. |
| `/accounts-payable/list` | bloqueado | `200`, sin contenido autenticado | Ruta protegida no validada. | Reintentar con usuario piloto autenticado. |

Notas:

- Browser Use no pudo inicializar por error de runtime: `failed to read Node version (exit code 7)`.
- Se uso Playwright local como fallback para lectura no destructiva.
- No se leyeron tokens locales ni credenciales guardadas.
- No se crearon, editaron ni borraron datos.
