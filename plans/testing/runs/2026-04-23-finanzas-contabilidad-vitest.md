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

## Browser smoke Fase 0 autenticado

Fecha: `2026-04-25`

Estado: `FAILED_BROWSER_SMOKE`

Entorno:

- `vm status`: sesion activa.
- Auth emulator: `9099`.
- Firestore emulator: `8081`.
- Functions emulator: `5001`.
- Vite: `5173`.
- Seed: `tmp/emulator-seeds/X63aIFwHzk3r0gmT8w6P/business-slice.json`.
- Business: `X63aIFwHzk3r0gmT8w6P`.

Validacion login:

- `clientLogin` contra emulator OK.
- `signInWithCustomToken` contra Auth emulator OK.
- La app entro a `Developer Hub`.

Smoke:

| ID | Ruta | Estado | Evidencia | Hallazgo | Accion |
| --- | --- | --- | --- | --- | --- |
| F0-01 | `/settings/accounting` | fail | `200`, final URL correcta | Queda en `Cargando sesión...`; no renderiza configuracion contable. | Investigar guard/loading de settings. |
| F0-02 | `/contabilidad/libro-diario` | fail | `200`, final URL correcta | Queda en `Cargando sesión...`; logs `session refresh error: internal`. | Investigar refresh de sesion y carga de journal. |
| F0-03 | `/contabilidad/libro-mayor` | partial/fail | Redirige a `/accounting/general-ledger`, muestra shell y texto de mayor | No termina datos: `Cargando cuentas contables del libro mayor...`; logs `Maximum update depth exceeded`. | Corregir loop React/carga de mayor. |
| F0-04 | `/contabilidad/reportes` | partial/fail | Redirige a `/accounting/reports`, muestra shell y texto de reportes | No termina reportes; logs `Error cargando reportes contables backend: FirebaseError: internal` y `Maximum update depth exceeded`. | Investigar callable `getAccountingReports` en emulator y loop React. |
| F0-05 | `/accounts-payable/list` | fail | `200`, title `Cuentas por Pagar - Ventamax` | Queda en `CARGANDO...`; logs `Maximum update depth exceeded`. | Investigar CxP + dependencias contables cargadas en shell. |

Logs relevantes:

- `session refresh error: internal`.
- `Error cargando reportes contables backend: FirebaseError: internal`.
- `Maximum update depth exceeded`.
- `@firebase/database: Provided authentication credentials ... invalid`.

Capturas generadas:

- `tmp/smoke-auth-F0-01.png`
- `tmp/smoke-auth-F0-02.png`
- `tmp/smoke-auth-F0-03.png`
- `tmp/smoke-auth-F0-04.png`
- `tmp/smoke-auth-F0-05.png`

Decision:

- No avanzar a flujos que crean documentos hasta resolver Fase 0.
- Prioridad tecnica: `getAccountingReports` en emulator, refresh de sesion, loop React en shell contable/CxP.

## Browser E2E venta -> factura -> contabilidad

Fecha: `2026-04-25`

Estado: `PARTIAL_PASS_WITH_SETUP_GAP`

Entorno:

- Browser in-app autenticado en `http://127.0.0.1:5173/developer-hub`.
- Business: `X63aIFwHzk3r0gmT8w6P`.
- Usuario seed: `BdNGtDt3y0`.
- Caja abierta con helper local: `vm seed-cash-count`.

Flujo ejecutado:

| Paso | Estado | Evidencia | Hallazgo |
| --- | --- | --- | --- |
| Abrir venta | pass | `/sales?mode=sale` carga productos y carrito. | Primer intento bloquea por caja cerrada. |
| Abrir caja desde UI | fail/parcial | Modal de autorizacion pide PIN/clave. | Al cambiar a clave, inputs del dialog quedaron `enabled=false`; no permitio autorizar desde UI. |
| Abrir caja por helper local | pass | `vm seed-cash-count` responde `cuadre creado o ya existente`. | Necesario para continuar E2E en emulador. |
| Crear venta | pass | Producto `Clorets`, total `RD$120.36`. | `CONSUMIDOR FINAL` sin secuencia; se cambio a `CREDITO FISCAL`. |
| Factura creada | pass | `invoicesV2/bLVnNTC_HTPi6wEck6W3T`, estado `committed`, factura `970`, NCF `B0100000144`. | Facturacion fiscal funciona con secuencia disponible. |
| Facturas UI | pass | `/bills` muestra `970`, `B0100000144`, `Generic Client`, `Pagada`, total `$120.36`. | Factura visible y comprobante friendly visible. |
| Evento contable | pass/parcial | `accountingEvents/invoice.committed__bLVnNTC_HTPi6wEck6W3T`, `sourceDocumentId=B0100000144`. | Antes de configurar base queda `pending_account_mapping`. |
| Libro diario antes de base | partial | Muestra `B0100000144` como `Sin mapeo`, 0 lineas. | Negocio tenia `chartOfAccounts=0`, `postingProfiles=0`. |
| Seed catalogo contable | pass | `/settings/accounting/chart-of-accounts` -> `Completar base`; 25 cuentas activas. | Setup requerido para negocio piloto. |
| Seed perfiles contables | pass | `/settings/accounting/posting-profiles` -> `Completar plantilla base`; 17 perfiles activos, 42 lineas. | Perfil `Venta al contado` creado. |
| Reproyeccion | pass | Callable `replayAccountingEventProjection` retorna `status=projected`, `journalEntryId=invoice.committed__bLVnNTC_HTPi6wEck6W3T`. | Reproceso manual necesario para evento creado antes de perfiles. |
| Asiento contable | pass | `journalEntries/invoice.committed__bLVnNTC_HTPi6wEck6W3T`, estado `posted`. | Lineas: `1100 Caja general` debito `120.36`, `4100 Ventas` credito `102.00`, `2200 Impuestos por pagar` credito `18.36`. |
| Libro diario despues de base | pass | `/accounting/journal-book`: 1 asiento, 3 lineas, debitos `RD$120.36`, creditos `RD$120.36`, documento `B0100000144`. | Cuadrado. |
| Libro mayor | pass | `/accounting/general-ledger`: cuenta `1100 Caja general`, ref `B0100000144`, debito `120.36`, saldo `120.36`. | Mayor usa NCF como referencia operativa. |
| Reportes | pass | `/accounting/reports`: debitos `120.36`, creditos `120.36`, resultado neto `102.00`. | Balance refleja caja `120.36`, ITBIS por pagar `18.36`, resultado `102.00`. |
| Ver origen desde detalle contable | fail | Drawer muestra boton `Ver origen`, pero URL permanece `/accounting/journal-book`. | Enlace/origen no navega a factura o modal origen. |

IDs del ciclo:

- Factura V2: `bLVnNTC_HTPi6wEck6W3T`.
- Numero factura: `970`.
- NCF: `B0100000144`.
- Accounting event: `invoice.committed__bLVnNTC_HTPi6wEck6W3T`.
- Journal entry: `invoice.committed__bLVnNTC_HTPi6wEck6W3T`.
- Cash movement: `inv_bLVnNTC_HTPi6wEck6W3T_cash_1`.
- Cash count: `cash-count-1777167134097`.

Hallazgos nuevos:

- El negocio piloto puede quedar con contabilidad general habilitada pero sin catalogo ni perfiles; en ese estado ventas generan evento, pero libro mayor/reportes quedan en cero hasta completar base y reproyectar.
- El flujo de autorizacion de apertura de caja desde UI quedo bloqueado con inputs deshabilitados al usar contraseña completa.
- El detalle del libro diario expone `Ver origen`, pero no navega/abre la factura origen.
- `replayAccountingEventProjection` respondio `ok=true` con `deadLetterId` poblado aunque el dead letter no existe; revisar payload de respuesta para no confundir UI/operacion.
