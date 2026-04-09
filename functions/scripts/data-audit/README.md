# Data Audit (Local)

Scripts in this folder are **one-off local utilities** to inspect Firestore data shapes and invariants.

They are meant to write outputs under repo `.tmp/` (gitignored) so you can review the exported JSON
without polluting `git status`.

## Export Business Data Pack

From repo root:

```powershell
cd C:\Dev\VentaMas\functions

node .\scripts\data-audit\export-business-data.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessId=BUSINESS_ID
```

By default it exports **sanitized** docs (redacts most strings) into:

`C:\Dev\VentaMas\.tmp\data-audit\<BUSINESS_ID>\<YYYYMMDD-HHMMSS>\`

If you really need the full raw docs (includes potentially sensitive fields):

```powershell
node .\scripts\data-audit\export-business-data.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessId=BUSINESS_ID --includeSensitive=1
```


## Purchase Rollout Readiness

From repo root:

```powershell
cd C:\Dev\VentaMas\functions

node .\scripts\data-audit\purchase-rollout-readiness.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessId=BUSINESS_ID
```

This writes a readiness report under:

`C:\Dev\VentaMas\.tmp\data-audit\<BUSINESS_ID>\<YYYYMMDD-HHMMSS>\analysis\`

Readonly by default. The report now also includes:

- `bankAccounts` total/active counts
- `bankingMode` (`cash-only`, `bank-enabled`, `unspecified`)
- `supplier_payment` coverage in `cashMovements`
- readiness blockers/warnings
- post-write re-audit when `--write=1`

Important:

- if `settings/accounting.bankAccountsEnabled=false`, readiness treats the
  business as `cash-only`
- in `cash-only`, missing `bankAccounts` are no longer a blocker
- if the business later wants `card`/`transfer`, it must switch back to
  `bank-enabled` and create at least one active `bankAccount`

To clear only `paymentState.nextPaymentAt` for settled purchases:

```powershell
node .\scripts\data-audit\purchase-rollout-readiness.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessId=BUSINESS_ID `
  --write=1 --fixPaidNextPaymentAt=1
```

To also clear stale `paymentTerms.nextPaymentAt` on settled purchases and fix
base-currency purchase snapshots that still carry `rateType: sell`:

```powershell
node .\scripts\data-audit\purchase-rollout-readiness.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessId=BUSINESS_ID `
  --write=1 `
  --fixPaidNextPaymentAt=1 `
  --fixSettledPaymentTermsNextPaymentAt=1 `
  --fixBaseCurrencyRateType=1
```

To backfill only legacy purchases that are safely reconstructable as
`completed + cash + immediate`:

```powershell
node .\scripts\data-audit\purchase-rollout-readiness.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessId=BUSINESS_ID `
  --write=1 `
  --backfillCompletedImmediateCashPaymentState=1
```

To normalize wrapped legacy purchases (`{ data: { ... } }`) and derive
missing `paymentTerms` / `paymentState` before rollout:

```powershell
node .\scripts\data-audit\purchase-rollout-readiness.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessId=BUSINESS_ID `
  --write=1 `
  --normalizeLegacyPurchaseEnvelope=1 `
  --backfillDerivedPaymentTerms=1 `
  --backfillDerivedPaymentState=1
```

To clean canceled legacy purchases without operational payment state and to
clear bogus `1970` immediate-cash payment dates:

```powershell
node .\scripts\data-audit\purchase-rollout-readiness.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessId=BUSINESS_ID `
  --write=1 `
  --backfillCanceledLegacyTerminalState=1 `
  --fixInvalidImmediateCashPaymentDates=1
```

To repair base-currency `rateType` in `accountsPayablePayments` and fill
missing `cashCountId` / `bankAccountId` on repairable `supplier_payment`
`cashMovements`:

```powershell
node .\scripts\data-audit\purchase-rollout-readiness.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessId=BUSINESS_ID `
  --write=1 `
  --fixAccountsPayableBaseCurrencyRateType=1 `
  --fixSupplierPaymentCashMovementRefs=1
```

## Purchase Rollout Cohorts

Readonly multi-business audit to rank businesses by migration burden and surface
what each one needs before opening purchases/CxP rollout.

```powershell
cd C:\Dev\VentaMas\functions

node .\scripts\data-audit\purchase-rollout-cohorts.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json
```

Optional:

```powershell
node .\scripts\data-audit\purchase-rollout-cohorts.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessIds=ID1,ID2,ID3 `
  --limit=10 `
  --sampleLimit=5
```

This writes a consolidated report under:

`C:\Dev\VentaMas\.tmp\data-audit\purchase-rollout-cohorts\<YYYYMMDD-HHMMSS>\analysis\`

## Purchase Rollout Activate

Local activation helper to opt one or more businesses into purchases/CxP rollout
without touching code again.

Readonly preview:

```powershell
cd C:\Dev\VentaMas\functions

node .\scripts\data-audit\purchase-rollout-activate.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessIds=BUSINESS_ID
```

Activate a business as `cash-only`:

```powershell
node .\scripts\data-audit\purchase-rollout-activate.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessIds=BUSINESS_ID `
  --write=1 `
  --functionalCurrency=DOP `
  --documentCurrencies=DOP `
  --bankAccountsEnabled=0
```

Activate a business as `bank-enabled`:

```powershell
node .\scripts\data-audit\purchase-rollout-activate.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessIds=BUSINESS_ID `
  --write=1 `
  --functionalCurrency=DOP `
  --documentCurrencies=DOP `
  --bankAccountsEnabled=1
```

The script always writes `rolloutEnabled=true`, preserves existing currencies
when already configured, and exports a JSON summary under:

`C:\Dev\VentaMas\.tmp\data-audit\purchase-rollout-activate\<YYYYMMDD-HHMMSS>\analysis\`
