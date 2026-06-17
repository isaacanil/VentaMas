# Auditoria profunda conservadora - 2026-06-12

## 1. Resumen ejecutivo

Se audito el repositorio con una pasada principal y subagentes de arquitectura, bugs, seguridad, performance/costo, tests/CI y mantenibilidad. Despues de consolidar hallazgos, se implementaron solo fixes de bajo riesgo o riesgo medio acotado, sin cambiar UX, API publica, modelo de datos ni reglas de negocio esperadas.

Se corrigieron bugs verificables en generacion de cuotas, snapshots de caja, carga de inventario por vencimiento, borrado async de comprobantes duplicados, progreso global de uploads, resolucion de proveedores en ordenes, un error de typecheck en Product Studio, divergencia de defaults entre schemas contables frontend/Functions, carga eager de ExcelJS y cobertura de tests de scripts operativos. Tambien se actualizo el README para reflejar el stack y comandos reales.

No se tocaron reglas Firestore, auth/session legacy, endpoints publicos ni listeners de alto impacto que requieren decision de producto o migracion. Esos puntos quedan documentados como backlog prioritario.

## 2. Stack y arquitectura detectada

- Frontend: React 19, Vite 8/Rolldown, TypeScript, Redux Toolkit, React Query, AntD, HeroUI y styled-components.
- Backend: Firebase Cloud Functions v2, Node 24, JS con `allowJs`, Firestore, Storage, triggers, callables y HTTP endpoints.
- Estructura: `src/` para app React, `functions/src/` para Functions, `src/firebase/**` como frontera de datos frontend, `functions/src/index.js` como export aggregator de Functions, `firestore.rules` y `storage.rules` para permisos.
- Rutas: `src/main.tsx` monta providers, `src/App.tsx` delega al router, `src/router/index.tsx` separa rutas publicas/privadas, `src/router/routes/routes.tsx` agrega rutas por modulo.
- Comandos importantes:
  - `npm run lint:all`
  - `npm run test:run:all`
  - `npm run typecheck:all`
  - `npm --prefix functions run build`
  - `npm run build`
  - `git diff --check`

## 3. Linea base inicial

- Rama inicial: `fix/deep-audit-safe-fixes`, tracking `origin/fix/deep-audit-safe-fixes`.
- Estado inicial: `git status --short` limpio.
- Node/npm: Node `v24.16.0`, npm `11.13.0`.
- CI versionado: no se encontro `.github`.

| Comando inicial | Resultado |
|---|---|
| `npm run lint:all` | FALLO preexistente en `typecheck:dev`: `src/modules/dev/pages/DevTools/ProductStudio/utils/productStudioForm.ts(206,5)` por `ResolvedBrandSelection` no asignable a `ProductPatch`. ESLint web, ESLint Functions y Stylelint ya habian pasado antes del fallo. |
| `npm run test:run:all` | OK antes de cambios: 147 archivos web / 550 tests, 102 archivos Functions / 497 tests. |
| `npm run build` | OK antes de cambios. |
| `npm --prefix functions run build` | OK antes de cambios. |

## 4. Hallazgos priorizados

| Hallazgo | Evidencia | Impacto | Riesgo | Solucion propuesta | Estado y razon |
|---|---|---:|---:|---|---|
| Typecheck roto en Product Studio | `src/modules/dev/pages/DevTools/ProductStudio/utils/productStudioForm.ts:206` | Medio | Bajo | Devolver un patch plano `{ brandId, brand }` en vez de un tipo sin index signature. | Implementado; era fallo de baseline. |
| Borrado de comprobantes duplicados no esperaba deletes | `src/firebase/taxReceipt/removeDuplicateTaxReceipts.ts` usaba `forEach` con promesas | Medio | Bajo | `await Promise.all(...)` con manejo por item. | Implementado; preserva criterio de seleccion. |
| Modal de inventario por vencimiento podia romper con batch eliminado y quedarse cargando | `src/components/modals/ProductExpirySelection/fbFetchAllInventoryData.ts` | Medio | Bajo | Filtrar batches faltantes, fallback de `loading=false`, cancelar updates tardios. | Implementado. |
| Cuotas CxC podian producir `NaN`/`Infinity` | `src/domain/accountsReceivable/generateInstallments.ts`, `functions/src/app/modules/accountReceivable/utils/generateInstallments.js` | Alto | Medio | Validar numeros finitos e installments enteros positivos; aceptar strings numericos persistidos. | Implementado con tests frontend/backend. |
| `cashCountSnap.data()` antes de verificar `exists` | `functions/src/app/modules/cashCount/services/cashCount.service.js` | Medio | Bajo | Lanzar `HttpsError('not-found')` antes de leer `.data()`. | Implementado con test. |
| Progreso global de upload podia pasar de 100% | `src/firebase/img/fbUploadFileAndGetURL.ts` | Bajo/Medio | Bajo | Acumular bytes por archivo y clamp a 100%. | Implementado. |
| Un provider invalido rompia toda la lista de ordenes | `src/firebase/order/useFbGetOrders.tsx` | Bajo/Medio | Bajo | Guard de DocumentReference y error aislado por orden. | Implementado con test. |
| Schemas contables duplicados divergian en defaults | `src/shared/accountingSchemas.js`, `functions/src/shared/accountingSchemas.js` | Medio | Bajo/Medio | Test de paridad y default explicito de treasury. | Implementado; no se fusionaron Zod 3/Zod 4. |
| Test operativo de compras quedaba fuera de la suite | `functions/scripts/data-audit/purchaseRolloutReadiness.shared.test.mjs`, `package.json` | Medio | Bajo | Agregar script Node test y encadenarlo en `test:run:all`. | Implementado. |
| README desactualizado | `README.md` decia Vite 6 y scripts inexistentes | Bajo | Bajo | Actualizar stack y comandos reales. | Implementado. |
| BackOrders cargaba ExcelJS al abrir pantalla | `src/modules/orderAndPurchase/pages/OrderAndPurchase/BackOrders/BackOrders.tsx` | Medio | Bajo | Import dinamico dentro de export. | Implementado por worker. |
| `lastSelectedBusinessId` self-writable puede afectar auth legacy | `firestore.rules:131`, `firestore.rules:348`, colecciones bajo `firestore.rules:728` | Alto/Critico | Alto | Migrar a membresia canonica/backfill y quitar ese campo de autorizacion. | Documentado; requiere migracion y decision humana. |
| Callables confian en IDs de usuario del payload | `createInvoice.controller.js`, `finalizeInventorySession.js`, `createBusiness.js`, `ensureDefaultWarehousesForBusinesses.js`, NCF ledger controllers | Alto/Critico | Medio/Alto | Requerir `request.auth.uid` o resolver compartido validado; rechazar mismatch. | Documentado; cambio sensible de compatibilidad. |
| `/users` readable por active user con hashes de password | `firestore.rules:362`, `clientAuth.controller.js` | Alto | Alto | Separar credenciales privadas y endurecer reads. | Documentado; migracion de auth. |
| `quotationPdf` callable sin auth | `functions/src/app/modules/quotation/quotationGenerate/quotationGenerate.js` | Medio | Medio | Requerir auth/access o mover client-side; rate limit/App Check si publico. | Documentado; necesita decision de uso publico. |
| Session token por query/body en HTTP auth | `functions/src/app/versions/v2/auth/services/httpAuth.service.js:58` | Medio | Medio | Deprecar query/body; usar `Authorization`/header. | Documentado; depende de clientes externos. |
| Listeners Firestore grandes y costos altos | Accounting, Treasury, Utility, Home dashboard | Medio/Alto | Medio/Alto | Paginacion/limites/agregados por pantalla. | Documentado; riesgo funcional por historicos. |

## 5. Cambios implementados

| Archivos | Cambio | Verificacion | Riesgo residual |
|---|---|---|---|
| `productStudioForm.ts` | Corrige el patch de brand para satisfacer `ProductPatch`. | `npm run typecheck:all`, `npm run lint:all`. | Bajo. |
| `fbFetchAllInventoryData.ts` | Evita loading infinito, ignora batches faltantes y evita update tardio tras cleanup. | `npm run typecheck:all`, lint focal, build. | Bajo; no cambia datos. |
| `removeDuplicateTaxReceipts.ts` | Espera deletes de duplicados y registra errores por item. | lint focal, `npm run lint:all`. | Bajo; mantiene estrategia de seleccion. |
| `generateInstallments.ts`, `generateInstallments.js` | Valida inputs finitos y enteros; acepta strings numericos. | Tests frontend/backend nuevos y suite completa. | Medio bajo por ruta de dinero; comportamiento esperado para datos validos intacto. |
| `cashCount.service.js` | Devuelve `not-found` correcto antes de leer snapshots inexistentes. | Test nuevo, Functions build. | Bajo. |
| `fbUploadFileAndGetURL.ts` | Corrige progreso global acumulado por archivo. | typecheck/lint/build. | Bajo. |
| `useFbGetOrders.tsx` | Aisla fallos de provider por orden. | Test nuevo, typecheck/lint. | Bajo; provider invalido ahora queda `null` o se preserva si ya era embebido. |
| `BackOrders.tsx` | Import dinamico de `exceljs` solo al exportar. | lint focal, typecheck, build. | Bajo; chunk lazy aun existe para export. |
| `accountingSchemas.js` en `src` y `functions/src` | Default explicito de treasury y test de paridad. | Tests contables frontend/functions, suite completa. | Bajo; no centraliza schemas aun. |
| `package.json` | Agrega `test:run:functions:scripts` y lo incluye en `test:run:all`. | `npm run test:run:all`. | Bajo. |
| `README.md` | Actualiza Vite 8 y comandos reales. | Revision/lint wrapper con warnings de archivos ignorados. | Bajo. |

## 6. Tests y validacion

Tests agregados:

- `src/firebase/order/useFbGetOrders.test.tsx`
- `functions/src/app/modules/accountReceivable/utils/generateInstallments.test.js`
- `functions/src/app/modules/cashCount/services/cashCount.service.test.js`
- `functions/src/shared/accountingSchemas.parity.test.js`
- Casos nuevos en `src/domain/accountsReceivable/generateInstallments.test.ts`

Validacion final:

| Comando final | Resultado |
|---|---|
| `npm run lint:all` | OK. |
| `npm run test:run:all` | OK: 148 archivos web / 553 tests; 105 archivos Functions / 504 tests; 6 tests Node de scripts. |
| `npm --prefix functions run build` | OK. |
| `npm run build` | OK. |
| `git diff --check` | OK; solo warnings CRLF del entorno Windows. |

## 7. Revision final del diff

- Diff final: 14 archivos modificados y 4 tests nuevos.
- No se tocaron `firestore.rules`, `storage.rules`, secrets, `.env`, deploy helper, auth legacy ni modelos de datos.
- No se ejecuto deploy.
- Cambios en `functions/` afectan funciones compartidas; si se despliega, debe ser selectivo.
- Riesgo sensible: la validacion de cuotas en backend cambia datos malformados de `NaN`/`Infinity` a "no generar cuotas"; esto es intencional para evitar contaminacion de datos, pero conviene monitorear logs de `No hay cuotas para generar`.
- Riesgo sensible: default contable `treasury` ahora queda explicito con campos `null` en ambos runtimes. La prueba de paridad cubre este contrato.

Deploy selectivo recomendado si se decide publicar los cambios de Functions:

```powershell
firebase deploy --only "functions:createAccountsReceivable,functions:processInvoiceOutbox,functions:createInvoiceV2,functions:createInvoiceV2Http,functions:closeAccountingPeriod,functions:createManualJournalEntry,functions:getAccountingReports,functions:reverseJournalEntry,functions:projectAccountingEventToJournalEntry,functions:closeCashCount,functions:createInternalTransfer,functions:resolveBankStatementLineMatch,functions:processAccountsReceivablePayment,functions:voidAccountsReceivablePayment,functions:syncCustomerCreditNoteApplicationAccountingEvent,functions:syncCustomerCreditNoteIssuedAccountingEvent,functions:syncExpenseAccountingEvent,functions:syncPurchaseCommittedAccountingEvent,functions:syncAccountsPayablePayment,functions:syncPurchaseSupplierCreditNote,functions:deleteDraftInvoice,functions:updateInvoiceFinancialDocument,functions:voidInvoiceFinancialDocument,functions:manageHrCommissionPeriod,functions:manageHrPayrollPayment"
```

## 8. Backlog recomendado

| Categoria | Tarea | Impacto | Riesgo | Estimacion |
|---|---|---:|---:|---:|
| Seguridad | Quitar `lastSelectedBusinessId` self-writable de autorizacion tras backfill de memberships canonicos. | Alto/Critico | Alto | L |
| Seguridad | Endurecer callables que aceptan `data.user.uid`/`userId` y rechazar mismatches con `request.auth.uid` o session resolver. | Alto/Critico | Medio/Alto | L |
| Seguridad | Separar hashes/passwords de `/users` hacia documentos server-only y crear superficie sanitizada de perfiles. | Alto | Alto | L |
| Seguridad | Requerir auth/access para `quotationPdf` o definirlo formalmente como endpoint publico con App Check/rate limit. | Medio | Medio | M |
| Performance | Limitar/paginar listeners de AccountingWorkspace y Treasury; separar vistas recientes de historicos/export. | Alto | Medio/Alto | L |
| Performance | Reducir listeners solapados en Utility/Home derivando rangos desde una suscripcion union o queries one-shot. | Medio/Alto | Medio | M |
| Performance | Reemplazar N+1 de pagos CxC en detalles de facturas por queries `in` en chunks y helper compartido. | Medio | Bajo/Medio | M |
| Tests/CI | Agregar CI versionado con `npm ci`, `npm run lint:all`, `npm run test:run:all`, `npm --prefix functions run build`, `npm run build`. | Alto | Bajo | M |
| Deuda tecnica | Extraer secciones de `FiscalCompliancePanel.tsx` y helpers de `accountingWorkspace.ts` por lotes con tests existentes. | Medio | Medio | L |
| Quick wins | Agregar tests/smoke al deploy helper selectivo y limpiar docs historicos con `src/views`/scripts obsoletos. | Bajo/Medio | Bajo | S |
