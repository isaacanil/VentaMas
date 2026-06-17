# Autofix contabilidad-finanzas

Fecha: 2026-05-05
Base: `docs/audits/accounting-finance-audit.md`
Modo: correccion autonoma segura, sin deploy, sin push, sin migraciones, sin datos reales.

## Resumen ejecutivo

Estado inicial confirmado por codigo:

- `accounts_receivable.payment.voided` y `accounts_payable.payment.voided` ya se emiten desde backend, pero los perfiles base no los sembraban.
- `/cash-reconciliation` estaba registrado dos veces; la version en ventas entraba antes y no tenia `BusinessFeatureRouteGate feature="treasury"`.
- `receivable_payment_void` existe como `cashMovements` de salida, pero los calculos de caja/auditoria sumaban solo `receivable_payment` de entrada.
- Tipos frontend de `CashMovementSourceType` estaban por detras de `LiquidityEntrySourceType`.

Cambios seguros ejecutados:

1. Agregar perfiles base inversos para void CxC/CxP.
2. Probar proyeccion GL de esos voids.
3. Eliminar ruta duplicada de ventas para que `/cash-reconciliation` use solo gate treasury.
4. Alinear tipo de source types de cash movements con liquidez.
5. Netear `receivable_payment_void` en cierre/auditoria de caja como movimiento negativo.

## Evidencia confirmada

### Critico 3 / Alto: voids sin perfiles base

Evidencia:

- `functions/src/app/modules/accountReceivable/functions/voidAccountsReceivablePayment.js` emite `accounts_receivable.payment.voided`.
- `functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.js` emite `accounts_payable.payment.voided`.
- `src/utils/accounting/postingProfiles.ts` tenia perfiles `*.payment.recorded`, pero no `*.payment.voided`.
- `functions/src/app/versions/v2/accounting/accountingEventProjection.service.js` manda evento sin perfil a `pending_account_mapping`.

Decision segura:

- Sembrar perfiles inversos usando las mismas cuentas canonicas existentes: `cash`, `bank`, `accounts_receivable`, `accounts_payable`.
- No crear cuentas nuevas.

### Alto: ruta duplicada `/cash-reconciliation`

Evidencia:

- `src/router/routes/paths/Sales.tsx` registraba `/cash-reconciliation` sin `BusinessFeatureRouteGate`.
- `src/router/routes/paths/CashReconciliation.tsx` registraba la misma ruta con `BusinessFeatureRouteGate feature="treasury"`.
- `src/router/routes/routes.tsx` agregaba `sales` antes que `cashReconciliation`.

Decision segura:

- Quitar la ruta duplicada desde `Sales.tsx`.

### Medio: `receivable_payment_void` ignorado en caja/auditoria

Evidencia:

- `functions/src/app/versions/v2/accounting/utils/cashMovement.util.js` crea `sourceType = receivable_payment_void` con `direction = out`.
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/hooks/usePaymentsForCashCount.ts` filtraba solo `receivable_payment`.
- `src/domain/cashCount/cashCountMetaData.ts` sumaba solo `receivable_payment` de entrada.
- `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.js` sumaba solo `receivable_payment` de entrada.

Decision segura:

- Tratar `receivable_payment_void` como monto negativo por signo/sourceType.
- Mantener fallback legacy sin cambios cuando no hay `cashMovements`.

## Cambios aplicados

### Perfiles base para void CxC/CxP

Archivo: `src/utils/accounting/postingProfiles.ts`

- `ar_payment_void_cash`: debita `accounts_receivable`, acredita `cash`.
- `ar_payment_void_bank`: debita `accounts_receivable`, acredita `bank`.
- `ap_payment_void_cash`: debita `cash`, acredita `accounts_payable`.
- `ap_payment_void_bank`: debita `bank`, acredita `accounts_payable`.
- Los perfiles usan los amount sources existentes:
  - `accounts_receivable_payment_amount`
  - `accounts_payable_payment_amount`
- Los perfiles usan condiciones existentes por canal:
  - `payment_channel_equals_cash`
  - `payment_channel_equals_bank`

Tests:

- `src/utils/accounting/postingProfiles.test.ts`
- `functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.test.js`

### Ruta duplicada de conciliacion de caja

Archivo: `src/router/routes/paths/Sales.tsx`

- Se elimino la ruta duplicada `/cash-reconciliation` desde ventas.
- Queda activa solo la ruta de `src/router/routes/paths/CashReconciliation.tsx`, que aplica `BusinessFeatureRouteGate feature="treasury"`.

Verificacion:

- `git grep -n "CASH_RECONCILIATION_LIST|CashReconciliation" -- src\router\routes\paths`
- Resultado: `/cash-reconciliation` queda solo en `CashReconciliation.tsx`.

### Tipo canonico de source types de cash movements

Archivo: `src/types/payments.ts`

- `CashMovementSourceType` ahora deriva de `LiquidityEntrySourceType`.
- Se elimina lista local atrasada.
- `receivable_payment_void`, `internal_transfer`, `opening_balance` y fuentes nuevas quedan alineadas con liquidez.

### Caja/cierre/auditoria netean voids CxC

Archivos:

- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/hooks/usePaymentsForCashCount.ts`
- `src/domain/cashCount/cashCountMetaData.ts`
- `src/domain/cashCount/cashCountMetaData.test.ts`
- `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.js`

Cambio:

- `receivable_payment` suma positivo.
- `receivable_payment_void` o `direction = out` suma negativo.
- Fallback legacy sin `cashMovements` se mantiene intacto.

Tests:

- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/hooks/usePaymentsForCashCount.test.ts`
- `src/domain/cashCount/cashCountMetaData.test.ts`

## Validaciones

### Pasaron

Comando:

```powershell
npm run test:run -- src/utils/accounting/postingProfiles.test.ts src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/hooks/usePaymentsForCashCount.test.ts src/domain/cashCount/cashCountMetaData.test.ts
```

Resultado:

- `Test Files 3 passed (3)`
- `Tests 13 passed (13)`

Comando:

```powershell
npm run test:run:functions -- functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.test.js functions/src/app/versions/v2/accounting/utils/cashMovement.util.test.js functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.test.js functions/src/app/modules/accountReceivable/functions/voidAccountsReceivablePayment.test.js
```

Resultado:

- `Test Files 4 passed (4)`
- `Tests 25 passed (25)`

Comando:

```powershell
npm run lint:fast
```

Resultado:

- `0 errors`
- `224 warnings`

Comando:

```powershell
npm run build
```

Resultado:

- Build paso.
- Warnings conocidos: chunks grandes y plugin timings.

Comando:

```powershell
$output = npm run typecheck 2>&1
$exitCode = $LASTEXITCODE
$pattern = 'src/utils/accounting/postingProfiles|src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/hooks/usePaymentsForCashCount|CashCountMetaData|src/types/payments|src/router/routes/paths/Sales|functions/src/app/versions/v2/cashCount|projectAccountingEventToJournalEntry'
"exit=$exitCode"
$matches = $output | Select-String -Pattern $pattern
if ($matches) { $matches } else { 'no touched-file typecheck errors in filtered output' }
```

Resultado:

- `exit=1`
- `no touched-file typecheck errors in filtered output`

### Fallo global existente

Comando:

```powershell
npm run typecheck
```

Resultado:

- Falla global por deuda TypeScript no acotada a este cambio.
- Primeros errores observados:
  - `src/router/guards/availability/FrontendFeatureRouteGate.tsx`: feature faltante `invoiceTemplateV2Beta`.
  - Exportaciones faltantes de `@ant-design/icons`.
  - Errores TS amplios en ventas, settings, firebase y rutas.
- Se corrigio el unico error tocado detectado en `src/utils/accounting/postingProfiles.ts`.

### Nota de ejecucion

- Un primer intento de tests frontend corrio en paralelo con tests functions y fallo por timeout de worker Vitest.
- Reejecucion aislada paso.

## Bloqueados

### BLOQUEADO: notas de credito cliente a GL

Requiere mover autoridad a backend, definir emision `customer_credit_note.issued/applied`, perfiles, tests y validar DGII/NCF. Riesgo fiscal-contable. No seguro como patch corto.

### BLOQUEADO: notas de credito suplidor a GL

Requiere definir tratamiento contable de emision/aplicacion de credito suplidor y sobrepago. No seguro inventar cuentas/perfiles sin decision contable.

### BLOQUEADO: FX settlement a GL

Requiere politica de ganancia/perdida realizada, moneda funcional, tasa efectiva y perfiles `fx_gain/fx_loss`. No seguro sin criterio contable.

### BLOQUEADO: write-off bancario a GL

Requiere decidir si se crea evento nuevo o asiento manual controlado, y cuentas de comisiones/diferencias. `ACCOUNTING_EVENT_TYPE_VALUES` no incluye evento bancario especifico.

### BLOQUEADO: `cashAccountId` canonico para caja POS

Requiere decision de modelo y posible migracion/backfill. Seguro solo documentar; no cambiar identidad historica en esta sesion.

### BLOQUEADO: vendor bill fuente canonica unica

Requiere decision de ownership frontend/backend y migracion de writes existentes. No seguro como cambio pequeno.

## Riesgos pendientes

- Perfiles base nuevos ayudan negocios que reseed/completen plantilla; negocios ya sembrados pueden requerir accion operativa para agregar perfiles faltantes.
- Auditoria backend de caja fue cambiada sin test dedicado directo para `runCashCountAudit.controller.js`; queda cubierta por logica equivalente en frontend y tests de cash movements/proyeccion disponibles.
- No se ejecuto deploy.
- No se ejecuto push.
- No se ejecuto migracion/backfill.
- Worktree tenia cambios no relacionados antes y durante esta sesion; se dejaron intactos.

## Proximo ciclo recomendado

1. Definir operacion para insertar perfiles `*.payment.voided` en negocios ya sembrados sin duplicar perfiles.
2. Crear prueba directa para `runCashCountAudit.controller.js` con `receivable_payment_void`.
3. Disenar eventos/perfiles para notas de credito cliente y suplidor.
4. Disenar politica FX/write-off antes de tocar GL.
5. Limpiar deuda global de `npm run typecheck` en rama separada.

## Deploy pendiente si se publica

Se modifico codigo en `functions/`.

```powershell
firebase deploy --only "functions:runCashCountAudit"
```
