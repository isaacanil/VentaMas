# Accounting hardening pass - 2026-06-15

## Scope

This pass focused on the highest-risk accounting robustness gaps found while comparing VentaMas with mature accounting products such as Odoo and QuickBooks:

- accounting event projection consistency
- period close blockers
- finance readiness diagnostics
- supplier credit note traceability
- remaining ERP-grade gaps

No production or staging data was changed in this pass.

## Changes implemented

### Period close now verifies projected journal entries

`closeAccountingPeriod` already blocked pending/failed accounting events, dead letters, and unbalanced journal entries. It now also blocks a period when an accounting event says it is `projected` but the referenced `journalEntryId` is not present in the period journal entries query.

Why this matters:

- A projected event without a real journal entry is worse than a pending event because the system can look clean while the ledger is incomplete.
- This closes a gap in the event -> journalEntries contract before a month can be marked closed.

Affected files:

- `functions/src/app/modules/accounting/functions/closeAccountingPeriod.js`
- `functions/src/app/modules/accounting/functions/closeAccountingPeriod.test.js`

### Period close uses accounting event effective dates

The close flow now loads accounting events by `occurredAt`, `entryDate`, `recordedAt`, and `createdAt`, then keeps records whose effective date belongs to the requested period. This covers events that have no `occurredAt` but were recorded in the period and would otherwise be invisible to the close blocker query.

### Projection dead letters are period-scoped going forward

New projection dead letters now persist `periodKey`. Period close uses that key to ignore active dead letters from other periods, while still treating old dead letters without `periodKey` as blockers until they are resolved or backfilled.

Affected files:

- `functions/src/app/versions/v2/accounting/accountingEventProjection.service.js`
- `functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.test.js`
- `functions/src/app/modules/accounting/functions/closeAccountingPeriod.js`
- `functions/src/app/modules/accounting/functions/closeAccountingPeriod.test.js`

### Existing journal entries are validated before reuse

Replay/projection previously trusted an existing `journalEntries/{eventId}` document. It now validates basic invariants before marking the event projected:

- same business when present
- same event id when present
- same event type when present
- not reversed
- balanced
- same period when both sides expose period keys
- same document and functional currency when both sides expose currency

Invalid existing entries now leave the event failed and create/refresh a projection dead letter instead of silently repairing the projection state.

### Finance readiness now flags projection and ledger integrity gaps

`analyzeFinanceReadiness` now reports:

- active accounting projection dead letters
- accounting events without projection status
- pending projections
- pending account mappings
- projected events missing `journalEntryId`
- projected events whose journal entry is not found in the analyzed sample
- unbalanced journal entries
- projection status counts and unbalanced journal entry count in metrics
- dead letter counts in metrics

Why this matters:

- Operators can see projection drift before month close.
- Readiness can no longer report a business as clean while event/journal consistency is broken.

Affected files:

- `functions/src/app/modules/accounting/functions/analyzeFinanceReadiness.js`
- `functions/src/app/modules/accounting/functions/analyzeFinanceReadiness.test.js`
- `functions/src/app/modules/accounting/functions/replayAccountingEventProjection.test.js`

### Supplier credit note applications now have an operational ledger

Supplier credit note applications are still posted through `accounts_payable.payment.recorded` to avoid duplicate GL entries. The payment transaction now also writes one operational trace document per applied supplier credit note under `supplierCreditNoteApplications`.

Each trace captures:

- supplier credit note id
- payment id
- purchase/vendor bill ids
- supplier id
- applied amount
- previous and next applied balances
- previous and next remaining balances
- status
- user and timing metadata

Voiding the payment marks the same trace as `voided` and records the restored amount. This improves drilldown/auditability without changing posting profiles or creating `supplier_credit_note.applied` as a second accounting event.

Affected files:

- `functions/src/app/modules/purchase/functions/addSupplierPayment.js`
- `functions/src/app/modules/purchase/functions/voidSupplierPayment.js`
- `functions/src/app/modules/purchase/functions/supplierPaymentLifecycle.test.js`

## Validation run

```powershell
npm run test:run:functions -- functions/src/app/modules/accounting/functions/closeAccountingPeriod.test.js functions/src/app/modules/accounting/functions/analyzeFinanceReadiness.test.js
```

Result: 2 test files passed, 20 tests passed.

Additional supplier credit trace validation:

```powershell
npm run test:run:functions -- functions/src/app/modules/purchase/functions/supplierPaymentLifecycle.test.js functions/src/app/modules/purchase/functions/supplierPaymentPeriodClosure.test.js functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.test.js functions/src/app/modules/purchase/functions/syncPurchaseSupplierCreditNote.test.js functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.test.js
```

Result: 5 test files passed, 40 tests passed.

Final combined validation:

```powershell
npm run test:run:functions -- functions/src/app/modules/accounting/functions/closeAccountingPeriod.test.js functions/src/app/modules/accounting/functions/analyzeFinanceReadiness.test.js functions/src/app/modules/accounting/functions/replayAccountingEventProjection.test.js functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.test.js functions/src/app/modules/purchase/functions/supplierPaymentLifecycle.test.js functions/src/app/modules/purchase/functions/supplierPaymentPeriodClosure.test.js functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.test.js functions/src/app/modules/purchase/functions/syncPurchaseSupplierCreditNote.test.js
npm --prefix functions run build
npm run lint:fast -- --quiet
git diff --check
```

Result: 8 function test files passed, 66 tests passed. `functions` build passed. `lint:fast` passed with 0 errors and 4 pre-existing warnings in unrelated files. `git diff --check` passed with only CRLF conversion warnings.

## Remaining critical gaps

### 1. Posted-entry inalterability

There is no verified Odoo-style hash chain or irreversible secure-posted-entry control for journal entries. Period close helps, but it is not the same as inalterability.

Recommended next step:

- Add a deterministic hash over posted journal entry core fields.
- Store previous hash per business/period or journal sequence.
- Exclude mutable UI metadata from the hash.
- Add a read-only integrity check report before adding any destructive migration.

### 2. Post-close exception policy

The close flow blocks normal writes into closed periods, but the product still needs a documented policy for corrections after close.

Recommended next step:

- Prefer reversal/adjustment entries in a later open period.
- Require accounting-admin role and reason for any exception.
- Surface exception history in the period close panel.

### 3. Backfill old projection dead letters

New dead letters include `periodKey`, but existing records may not. Period close intentionally keeps unknown-period dead letters as blockers.

Recommended next step:

- Backfill `periodKey` on existing `accountingEventProjectionDeadLetters`.
- Resolve or replay old dead letters before relying on period-scoped close behavior.

### 4. Supplier credit note application drilldown

The backend now writes operational application traces, but the UI still needs drilldown/export surfaces for them.

Recommended next step:

- Keep GL posting in the AP payment event for now.
- Add UI drilldown for `supplierCreditNoteApplications`.
- Include application ids in supplier payment exports.
- Only introduce `supplier_credit_note.applied` as a posting event if AP payment profiles stop posting the supplier credit portion.

### 5. Live-data close rehearsal

This pass used code inspection and targeted tests, not staging data.

Recommended next step:

- Run readiness against a staging pilot business.
- Reconcile projection counts, journal entry counts, dead letters, and period close blockers.
- Perform at least one monthly close rehearsal and one December close rehearsal with seeded data.

## Deploy commands if these changes are promoted

Only the affected Cloud Functions need deployment:

```powershell
firebase deploy --only "functions:closeAccountingPeriod"
firebase deploy --only "functions:analyzeFinanceReadiness"
firebase deploy --only "functions:addSupplierPayment"
firebase deploy --only "functions:voidSupplierPayment"
```
