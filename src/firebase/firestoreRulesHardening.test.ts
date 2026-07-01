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

const expectCollectionReadRequiresAccountingAccess = (
  collection: string,
  param = 'documentId',
) => {
  expect(rules).toMatch(
    new RegExp(
      `match /businesses/\\{businessId\\}/${collection}/\\{${param}\\} \\{[\\s\\S]*?allow read: if hasAccountingReadAccess\\(businessId\\);`,
    ),
  );
};

const expectCollectionFullyDenied = (
  collection: string,
  param = 'documentId',
) => {
  expect(rules).toMatch(
    new RegExp(
      `match /businesses/\\{businessId\\}/${collection}/\\{${param}\\} \\{[\\s\\S]*?allow read, write: if false;`,
    ),
  );
};

describe('firestore financial hardening rules', () => {
  it('blocks direct client writes to posted accounting sources of truth', () => {
    expectCollectionLocked('journalEntries', 'journalEntryId');
    expectCollectionLocked('accountingEvents', 'eventId');
    expectCollectionLocked('accountsReceivable');
    expectCollectionLocked('accountsPayable');
    expectCollectionLocked('accountsPayablePayments');
    expectCollectionLocked('payments');
    expectCollectionLocked('cashMovements', 'movementId');
    expectCollectionLocked('cashCounts', 'cashCountId');
    expectCollectionLocked('cashCountSales', 'saleId');
    expectCollectionLocked(
      'supplierCreditNoteApplications',
      'applicationId',
    );
    expectCollectionLocked('supplierCreditNotes', 'supplierCreditNoteId');
    expectCollectionLocked('vendorBills', 'vendorBillId');
    expectCollectionLocked('vendorBillControlEvents', 'eventId');
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

  it('restricts accounts payable sources to accounting read roles', () => {
    expectCollectionReadRequiresAccountingAccess('accountsPayable');
    expectCollectionReadRequiresAccountingAccess('accountsPayablePayments');
    expectCollectionReadRequiresAccountingAccess(
      'supplierCreditNoteApplications',
      'applicationId',
    );
    expectCollectionReadRequiresAccountingAccess(
      'supplierCreditNotes',
      'supplierCreditNoteId',
    );
    expectCollectionReadRequiresAccountingAccess('vendorBills', 'vendorBillId');
    expectCollectionReadRequiresAccountingAccess(
      'vendorBillControlEvents',
      'eventId',
    );
    expect(rules).toMatch(
      /function isAccountsPayableProtectedCollection\(collectionId\) \{[\s\S]*?'accountsPayable'[\s\S]*?'accountsPayablePayments'[\s\S]*?'accountsPayablePaymentIdempotency'[\s\S]*?'supplierCreditNoteApplications'[\s\S]*?'supplierCreditNotes'[\s\S]*?'vendorBills'[\s\S]*?'vendorBillControlEvents'/,
    );
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/\{collectionId\}\/\{document=\*\*\} \{[\s\S]*?allow read: if hasBusinessAccess\(businessId\)[\s\S]*?&& !isAccountsPayableProtectedCollection\(collectionId\);/,
    );
  });

  it('keeps accounts payable internal control documents unreadable by clients', () => {
    expectCollectionFullyDenied(
      'accountsPayablePaymentIdempotency',
      'idempotencyId',
    );
  });

  it('lets active users read the global bank institution catalog', () => {
    expect(rules).toMatch(
      /match \/bankInstitutionCatalog\/\{institutionId\} \{[\s\S]*?allow read: if currentUserIsActive\(\);[\s\S]*?allow write: if hasGlobalRole\(\);/,
    );
  });

  it('only lets legacy invoice writes create/update/delete drafts without posted footprint', () => {
    expect(rules).toMatch(
      /allow create: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isSafeInvoiceDraftCreate\(request\.resource\.data\)[\s\S]*?\|\| isSafePreorderCreate\(request\.resource\.data\)/,
    );
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/invoices\/\{invoiceId\} \{[\s\S]*?allow update: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isDraftFinancialDocument\(resource\.data\)[\s\S]*?isDraftFinancialDocument\(request\.resource\.data\)[\s\S]*?!isLockedInvoiceDocument\(resource\.data\)[\s\S]*?!isLockedInvoiceDocument\(request\.resource\.data\)[\s\S]*?\|\| isSafePreorderUpdate\(resource\.data, request\.resource\.data\)/,
    );
    expect(rules).toMatch(
      /allow delete: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isDraftFinancialDocument\(resource\.data\)[\s\S]*?!isLockedInvoiceDocument\(resource\.data\);/,
    );
  });

  it('allows only safe preorder create/update paths without posted invoice footprint', () => {
    expect(rules).toMatch(
      /function isSafePreorderCreate\(data\) \{[\s\S]*?isPreorderFinancialDocument\(data\)[\s\S]*?documentStatus\(data\) == 'pending'[\s\S]*?!hasPostedPreorderFootprint\(data\)[\s\S]*?!hasInvalidPreorderCancelFootprint\(data\);/,
    );
    expect(rules).toMatch(
      /function isSafePreorderUpdate\(before, after\) \{[\s\S]*?documentStatus\(before\) == 'pending'[\s\S]*?documentStatus\(after\) in \['pending', 'cancelled'\][\s\S]*?!hasPostedPreorderFootprint\(after\)[\s\S]*?!hasInvalidPreorderCancelFootprint\(after\);/,
    );
    expect(rules).toMatch(
      /function hasPostedPreorderFootprint\(data\) \{[\s\S]*?'NCF'[\s\S]*?'cashCountId'[\s\S]*?'accountingEventId'/,
    );
    expect(rules).toMatch(
      /function hasInvalidPreorderCancelFootprint\(data\) \{[\s\S]*?'cancel'[\s\S]*?documentStatus\(data\) != 'cancelled';/,
    );
  });

  it('locks purchases after they leave the mutable receipt draft state', () => {
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/purchases\/\{purchaseId\} \{[\s\S]*?allow create: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isMutablePurchaseSource\(request\.resource\.data\)[\s\S]*?!isLockedPurchaseDocument\(request\.resource\.data\);/,
    );
    expect(rules).toMatch(
      /allow update: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isMutablePurchaseSource\(resource\.data\)[\s\S]*?isMutablePurchaseSource\(request\.resource\.data\)[\s\S]*?!isLockedPurchaseDocument\(resource\.data\)[\s\S]*?!isLockedPurchaseDocument\(request\.resource\.data\);/,
    );
    expect(rules).toMatch(
      /allow delete: if hasBusinessWriteAccess\(businessId\)[\s\S]*?isDeletablePurchaseSource\(resource\.data\)[\s\S]*?!isLockedPurchaseDocument\(resource\.data\);/,
    );
  });

  it('treats accounts payable purchase footprints as backend-owned', () => {
    expect(rules).toMatch(
      /function hasPostedPurchaseFootprint\(data\) \{[\s\S]*?'accountsPayable'[\s\S]*?'payables'[\s\S]*?'vendorBill'[\s\S]*?'vendorBillId'[\s\S]*?'accountsPayableId'/,
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

  it('requires synchronized product price fields when pricing is created or changed', () => {
    expect(rules).toMatch(
      /function hasSynchronizedProductPricing\(data\) \{[\s\S]*?data\.pricing\.get\('price', null\) == data\.pricing\.get\('listPrice', null\);/,
    );
    expect(rules).toMatch(
      /function productPricingUnchanged\(\) \{[\s\S]*?request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasAny\(\[[\s\S]*?'pricing'[\s\S]*?\]\)/,
    );
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/products\/\{productId\} \{[\s\S]*?allow create: if hasBusinessWriteAccess\(businessId\)[\s\S]*?hasSynchronizedProductPricing\(request\.resource\.data\);[\s\S]*?allow update: if hasBusinessWriteAccess\(businessId\)[\s\S]*?productPricingUnchanged\(\)[\s\S]*?hasSynchronizedProductPricing\(request\.resource\.data\)/,
    );
  });

  it('keeps the business catch-all read-only without reopening protected AP collections', () => {
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/\{collectionId\}\/\{document=\*\*\} \{[\s\S]*?allow read: if hasBusinessAccess\(businessId\)[\s\S]*?&& !isAccountsPayableProtectedCollection\(collectionId\);[\s\S]*?allow write: if false;/,
    );
  });

  it('locks invoice timeline and cash count sale subcollections to backend writes', () => {
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/invoicesV2\/\{invoiceId\} \{[\s\S]*?match \/timeline\/\{eventId\} \{[\s\S]*?allow read: if hasBusinessAccess\(businessId\);[\s\S]*?allow write: if false;/,
    );
    expect(rules).toMatch(
      /match \/businesses\/\{businessId\}\/cashCounts\/\{cashCountId\} \{[\s\S]*?match \/sales\/\{invoiceId\} \{[\s\S]*?allow read: if hasBusinessAccess\(businessId\);[\s\S]*?allow write: if false;/,
    );
  });
});
