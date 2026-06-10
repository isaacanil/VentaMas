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

  it('forces accounting setup writes through backend callables', () => {
    expectCollectionLocked('chartOfAccounts', 'chartOfAccountId');
    expectCollectionLocked('accountingPostingProfiles', 'postingProfileId');
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/bankAccounts\/\{bankAccountId\} \{[\s\S]*?allow create, update: if hasTreasuryConfigAccess\(businessId\);/,
    );
  });

  it('restricts accounting monitor sources to accounting read roles', () => {
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/journalEntries\/\{journalEntryId\} \{[\s\S]*?allow read: if hasAccountingReadAccess\(businessId\);/,
    );
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/accountingEvents\/\{eventId\} \{[\s\S]*?allow read: if hasAccountingReadAccess\(businessId\);/,
    );
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/accountingEventProjectionDeadLetters\/\{deadLetterId\} \{[\s\S]*?allow read: if hasAccountingReadAccess\(businessId\);/,
    );
  });

  it('lets active users read the global bank institution catalog', () => {
    expect(rules).toMatch(
      /match \/bankInstitutionCatalog\/\{institutionId\} \{[\s\S]*?allow read: if currentUserIsActive\(\);[\s\S]*?allow write: if hasGlobalRole\(\);/,
    );
  });

  it('only lets legacy invoice writes create/update/delete drafts without posted footprint', () => {
    expect(rules).toMatch(
      /allow create: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isSafeInvoiceDraftCreate\(request\.resource\.data\);/,
    );
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/invoices\/\{invoiceId\} \{[\s\S]*?allow update: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isDraftFinancialDocument\(resource\.data\)[\s\S]*?isDraftFinancialDocument\(request\.resource\.data\)[\s\S]*?!isLockedInvoiceDocument\(resource\.data\)[\s\S]*?!isLockedInvoiceDocument\(request\.resource\.data\);/,
    );
    expect(rules).toMatch(
      /allow delete: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isDraftFinancialDocument\(resource\.data\)[\s\S]*?!isLockedInvoiceDocument\(resource\.data\);/,
    );
  });

  it('locks purchases after they leave the mutable receipt draft state', () => {
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/purchases\/\{purchaseId\} \{[\s\S]*?allow create: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isMutablePurchaseSource\(request\.resource\.data\)[\s\S]*?!isLockedPurchaseDocument\(request\.resource\.data\);/,
    );
    expect(rules).toMatch(
      /allow update: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isMutablePurchaseSource\(resource\.data\)[\s\S]*?!isLockedPurchaseDocument\(resource\.data\);/,
    );
    expect(rules).toMatch(
      /allow delete: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isDeletablePurchaseSource\(resource\.data\)[\s\S]*?!isLockedPurchaseDocument\(resource\.data\);/,
    );
  });

  it('separates business read access from write access for inactive/read-only states', () => {
    expect(rules).toContain('function currentUserIsActive()');
    expect(rules).toContain('function businessAllowsRead(businessId)');
    expect(rules).toContain('function businessAllowsWrite(businessId)');
    expect(rules).toContain('function hasBusinessWriteAccess(businessId)');
    expect(rules).toContain("currentUserDoc().data.get('active', true)");
    expect(rules).toContain(
      "currentUserDoc().data.get('platformRoles', {}).get('dev', false)",
    );
    expect(rules).toContain("businessDoc(businessId).data.get('status', null)");
    expect(rules).toMatch(
      /function hasLegacyBusinessAccess\(businessId\) \{[\s\S]*?!exists\(memberPath\(businessId\)\)/,
    );
  });

  it('keeps the business catch-all read-only', () => {
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/\{document=\*\*\} \{[\s\S]*?allow read: if hasBusinessAccess\(businessId\);[\s\S]*?allow write: if false;/,
    );
  });
});
