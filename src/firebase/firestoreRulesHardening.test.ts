import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const rulesPath = path.join(process.cwd(), 'firestore.rules');
const rules = readFileSync(rulesPath, 'utf8');

const expectCollectionLocked = (collection: string, param = 'documentId') => {
  expect(rules).toMatch(
    new RegExp(
      `match /businesses/\\{businessId\\}/${collection}/\\{${param}\\} \\{[\\s\\S]*?allow create, update, delete: if false;`,
    ),
  );
};

describe('firestore financial hardening rules', () => {
  it('blocks direct client writes to posted accounting sources of truth', () => {
    expectCollectionLocked('journalEntries', 'journalEntryId');
    expectCollectionLocked('accountingEvents', 'eventId');
    expectCollectionLocked('accountsReceivable');
    expectCollectionLocked('accountsPayable');
    expectCollectionLocked('payments');
    expectCollectionLocked('cashMovements', 'movementId');
    expectCollectionLocked('cashCounts', 'cashCountId');
    expectCollectionLocked('vendorBills', 'vendorBillId');
  });

  it('forces fiscal and credit-note mutations through backend flows', () => {
    expectCollectionLocked('creditNotes', 'creditNoteId');
    expectCollectionLocked('creditNoteApplications', 'applicationId');
    expectCollectionLocked('ncfUsage', 'usageId');
    expectCollectionLocked('ncfLedger', 'ledgerId');
    expectCollectionLocked('taxReportRuns', 'runId');
    expectCollectionLocked('dgiiReports', 'reportId');
  });

  it('requires finance configuration roles for accounting setup writes', () => {
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/chartOfAccounts\/\{chartOfAccountId\} \{[\s\S]*?allow create, update: if hasFinanceConfigAccess\(businessId\);/,
    );
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/accountingPostingProfiles\/\{postingProfileId\} \{[\s\S]*?allow create, update: if hasFinanceConfigAccess\(businessId\);/,
    );
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/bankAccounts\/\{bankAccountId\} \{[\s\S]*?allow create, update: if hasTreasuryConfigAccess\(businessId\);/,
    );
  });

  it('only lets legacy invoice writes update/delete draft documents without posted footprint', () => {
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/invoices\/\{invoiceId\} \{[\s\S]*?allow update: if hasBusinessAccess\(businessId\)[\s\S]*?isDraftFinancialDocument\(resource\.data\)[\s\S]*?isDraftFinancialDocument\(request\.resource\.data\)[\s\S]*?!isLockedInvoiceDocument\(resource\.data\)[\s\S]*?!isLockedInvoiceDocument\(request\.resource\.data\);/,
    );
    expect(rules).toMatch(
      /allow delete: if hasBusinessAccess\(businessId\)[\s\S]*?isDraftFinancialDocument\(resource\.data\)[\s\S]*?!isLockedInvoiceDocument\(resource\.data\);/,
    );
  });

  it('keeps the business catch-all read-only', () => {
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/\{document=\*\*\} \{[\s\S]*?allow read: if hasBusinessAccess\(businessId\);[\s\S]*?allow write: if false;/,
    );
  });
});
