# Impacto de deploy: auth userAccess en Functions

## Regla corta

`functions/src/app/versions/v2/auth/services/userAccess.service.js` es un limite
compartido de autorizacion. Si cambia ese servicio, o si una Function empieza a
depender de el, el deploy debe ser selectivo pero amplio: no publicar todas las
Functions, pero si publicar todos los targets exportados cuyo bundle depende de
ese limite.

## Por que no alcanza con una sola Function

- Cloud Functions empaqueta el codigo importado al momento del deploy. Un cambio
  en `userAccess.service.js` no actualiza funciones ya publicadas si no se
  vuelven a desplegar.
- Desplegar solo la Function que disparo el cambio deja endpoints con reglas de
  auth viejas y endpoints con reglas nuevas al mismo tiempo.
- Desplegar `functions` completo es demasiado riesgoso en un worktree con cambios
  paralelos: puede publicar funciones no revisadas.
- El alcance correcto sale de `functions/src/index.js`: listar los exports
  desplegables que dependen directa o transitivamente de `userAccess.service.js`.

## Checklist de release

- [ ] Confirmar el diff de `functions/` y separar cambios ajenos antes de
      publicar.
- [ ] Regenerar el alcance con el grafo real de imports, no solo con el archivo
      que se edito.
- [ ] Revisar importadores directos:

```powershell
rg -n "userAccess\.service\.js" functions\src\app --glob "*.js" --glob "!*.test.js"
```

- [ ] Mapear esos importadores contra los exports de
      `functions/src/index.js`.
- [ ] Ejecutar los tests/build de Functions que correspondan al cambio.
- [ ] Hacer dry-run del helper antes del deploy real.
- [ ] Publicar primero en staging y validar endpoints criticos de auth.
- [ ] Promover a produccion solo con aprobacion de release.

## Set actual para userAccess

Este snapshot sale del checkout actual, siguiendo dependencias transitivas desde
`functions/src/index.js` hasta `userAccess.service.js`. Recalcular antes de usarlo
si hay cambios nuevos en `functions/`.

```powershell
$functions = @(
  'addSupplierPayment',
  'analyzeFinanceReadiness',
  'applyCustomerCreditNotes',
  'auditAccountsReceivableHttp',
  'autoRepairInvoiceV2Http',
  'backfillBankAccountChartLinks',
  'backfillJournalEntryAccountIds',
  'changeCashCountState',
  'closeAccountingPeriod',
  'closeCashCount',
  'createAccountingPostingProfile',
  'createAccountsReceivable',
  'createBankAccount',
  'createBankReconciliation',
  'createBankStatementLine',
  'createChartOfAccount',
  'createClient',
  'createCustomerCreditNote',
  'createInternalTransfer',
  'createInvoiceV2',
  'createInvoiceV2Http',
  'createManualJournalEntry',
  'createProduct',
  'createProvider',
  'createWarehouse',
  'deleteDraftInvoice',
  'disableAccountingPostingProfile',
  'disableChartOfAccount',
  'ensureDefaultWarehouseForBusiness',
  'exportDgiiTxtReport',
  'getAccountingReports',
  'getInvoiceV2Http',
  'manageHrCommissionPeriod',
  'manageHrEmployee',
  'manageHrPayrollPayment',
  'openCashCount',
  'previewBankReconciliation',
  'processAccountsReceivablePayment',
  'recalculateHrCommissionEntries',
  'recalculateProductStockTotals',
  'reconcileBatchStatusFromStocks',
  'refreshElectronicTaxReceiptStatus',
  'repairInvoiceV2Http',
  'replayAccountingEventProjection',
  'reserveCreditNoteNcf',
  'resolveBankStatementLineMatch',
  'reverseJournalEntry',
  'runCashCountAudit',
  'runMonthlyComplianceReport',
  'updateAccountingPostingProfile',
  'updateChartOfAccount',
  'updateCustomerCreditNote',
  'updateElectronicTaxReceiptConfig',
  'updateElectronicTaxReceiptPlatformConfig',
  'updateInvoiceFinancialDocument',
  'validateElectronicTaxReceiptConfig',
  'validateElectronicTaxReceiptPlatformConfig',
  'voidAccountsReceivablePayment',
  'voidInvoiceFinancialDocument',
  'voidSupplierPayment'
)
```

## Comandos

Dry-run staging con el helper del repo:

```powershell
npm run deploy -- staging:functions ($functions -join ',') --dry-run
```

Deploy staging, solo despues de revisar el dry-run:

```powershell
npm run deploy -- staging:functions ($functions -join ',')
```

Equivalente Firebase CLI directo para staging:

```powershell
firebase deploy --project staging --only ("functions:" + ($functions -join ',functions:'))
```

Produccion requiere guard explicito:

```powershell
$env:CONFIRM_PROD_DEPLOY = 'PROD'
npm run deploy -- prod:functions ($functions -join ',')
Remove-Item Env:\CONFIRM_PROD_DEPLOY
```

No usar `ALLOW_ALL_FUNCTIONS_DEPLOY=1` para este caso salvo aprobacion explicita:
el objetivo es publicar el limite compartido completo, no todo el codebase de
Functions.
