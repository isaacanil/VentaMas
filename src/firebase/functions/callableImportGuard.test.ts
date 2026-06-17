import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const SRC_DIR = path.join(process.cwd(), 'src');
const ALLOWED_WRAPPER_FILE = 'src/firebase/functions/callable.ts';

// Existing migration debt. Remove entries as files move to createFirebaseCallable.
const EXISTING_DIRECT_HTTPS_CALLABLE_IMPORT_DEBT = [
  'src/firebase/Auth/fbAuthV2/fbSelectActiveBusiness.ts',
  'src/firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser.ts',
  'src/firebase/accounting/accountingConfiguration.ts',
  'src/firebase/accounting/fbAnalyzeFinanceReadiness.ts',
  'src/firebase/accounting/fbCloseAccountingPeriod.ts',
  'src/firebase/accounting/fbCreateManualJournalEntry.ts',
  'src/firebase/accounting/fbExportDgiiTxtReport.ts',
  'src/firebase/accounting/fbGetAccountingReports.ts',
  'src/firebase/accounting/fbRunMonthlyComplianceReport.ts',
  'src/firebase/accountsReceivable/fbAddAR.ts',
  'src/firebase/billing/subscriptionPortal.ts',
  'src/firebase/cashCount/closing/fbCashCountClosed.ts',
  'src/firebase/cashCount/closing/fbCashCountClosing.ts',
  'src/firebase/cashCount/opening/fbCashCountOpening.ts',
  'src/firebase/creditNotes/fbAddCreditNote.ts',
  'src/firebase/creditNotes/fbConsumeCreditNotes.ts',
  'src/firebase/creditNotes/fbUpdateCreditNote.ts',
  'src/firebase/invoices/fbCancelInvoice.ts',
  'src/firebase/invoices/fbDeleteMultipleInvoices.tsx',
  'src/firebase/invoices/fbUpdateInvoice.ts',
  'src/firebase/processAccountsReceivablePayments/fbProcessClientPaymentAR.ts',
  'src/services/invoice/invoice.service.ts',
] as const;

const FIREBASE_FUNCTIONS_NAMED_IMPORT_PATTERN =
  /import\s+(?:type\s+)?\{(?<imports>[\s\S]*?)\}\s+from\s*['"]firebase\/functions['"];?/g;
const FIREBASE_FUNCTIONS_NAMESPACE_IMPORT_PATTERN =
  /import\s+\*\s+as\s+(?<namespace>[$A-Z_a-z][$\w]*)\s+from\s*['"]firebase\/functions['"];?/g;
const FIREBASE_FUNCTIONS_DEFAULT_IMPORT_PATTERN =
  /import\s+(?<namespace>[$A-Z_a-z][$\w]*)\s+from\s*['"]firebase\/functions['"];?/g;
const FIREBASE_FUNCTIONS_REQUIRE_PATTERN =
  /(?:const|let|var)\s+(?:(?<destructured>\{[\s\S]*?\})|(?<namespace>[$A-Z_a-z][$\w]*))\s*=\s*require\(\s*['"]firebase\/functions['"]\s*\)/g;
const FIREBASE_FUNCTIONS_DYNAMIC_IMPORT_PATTERN =
  /import\(\s*['"]firebase\/functions['"]\s*\)/;

const RUNTIME_SOURCE_PATTERN = /\.[cm]?[jt]sx?$/;
const SKIPPED_SOURCE_PATTERN =
  /\.(test|spec|stories)\.[cm]?[jt]sx?$/;

const normalizeSourcePath = (filePath: string) =>
  path.relative(process.cwd(), filePath).replaceAll(path.sep, '/');

const hasHttpsCallableMemberAccess = (text: string, namespace: string) => {
  const escapedNamespace = namespace.replaceAll('$', '\\$');
  return new RegExp(`\\b${escapedNamespace}\\s*\\.\\s*httpsCallable\\b`).test(
    text,
  );
};

const importsHttpsCallableDirectly = (text: string) => {
  const hasNamedImport = Array.from(
    text.matchAll(FIREBASE_FUNCTIONS_NAMED_IMPORT_PATTERN),
  ).some((match) => /\bhttpsCallable\b/.test(match.groups?.imports ?? ''));

  if (hasNamedImport) {
    return true;
  }

  const hasNamespaceImport = Array.from(
    text.matchAll(FIREBASE_FUNCTIONS_NAMESPACE_IMPORT_PATTERN),
  ).some((match) =>
    hasHttpsCallableMemberAccess(text, match.groups?.namespace ?? ''),
  );

  if (hasNamespaceImport) {
    return true;
  }

  const hasDefaultImport = Array.from(
    text.matchAll(FIREBASE_FUNCTIONS_DEFAULT_IMPORT_PATTERN),
  ).some((match) =>
    hasHttpsCallableMemberAccess(text, match.groups?.namespace ?? ''),
  );

  if (hasDefaultImport) {
    return true;
  }

  const hasRequireImport = Array.from(
    text.matchAll(FIREBASE_FUNCTIONS_REQUIRE_PATTERN),
  ).some((match) => {
    const { destructured = '', namespace = '' } = match.groups ?? {};

    return (
      /\bhttpsCallable\b/.test(destructured) ||
      hasHttpsCallableMemberAccess(text, namespace)
    );
  });

  if (hasRequireImport) {
    return true;
  }

  return (
    FIREBASE_FUNCTIONS_DYNAMIC_IMPORT_PATTERN.test(text) &&
    /\bhttpsCallable\b/.test(text)
  );
};

const listRuntimeSourceFiles = (directory: string): string[] => {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listRuntimeSourceFiles(entryPath);
    }

    if (!RUNTIME_SOURCE_PATTERN.test(entry.name)) return [];
    if (SKIPPED_SOURCE_PATTERN.test(entry.name)) return [];

    return [entryPath];
  });
};

const listDirectHttpsCallableImports = () =>
  listRuntimeSourceFiles(SRC_DIR)
    .map((filePath) => ({
      sourcePath: normalizeSourcePath(filePath),
      text: readFileSync(filePath, 'utf8'),
    }))
    .filter(({ text }) => importsHttpsCallableDirectly(text))
    .map(({ sourcePath }) => sourcePath)
    .sort();

describe('Firebase callable import guard', () => {
  it.each([
    [
      'named import',
      "import { httpsCallable } from 'firebase/functions';",
    ],
    [
      'namespace import',
      "import * as firebaseFunctions from 'firebase/functions';\nfirebaseFunctions.httpsCallable();",
    ],
    [
      'default import',
      "import firebaseFunctions from 'firebase/functions';\nfirebaseFunctions.httpsCallable();",
    ],
    [
      'destructured require',
      "const { httpsCallable } = require('firebase/functions');",
    ],
    [
      'namespace require',
      "const firebaseFunctions = require('firebase/functions');\nfirebaseFunctions.httpsCallable();",
    ],
    [
      'dynamic import',
      "const firebaseFunctions = await import('firebase/functions');\nfirebaseFunctions.httpsCallable();",
    ],
  ])('detects direct httpsCallable through %s', (_name, source) => {
    expect(importsHttpsCallableDirectly(source)).toBe(true);
  });

  it('allows other firebase/functions imports that do not call httpsCallable', () => {
    expect(
      importsHttpsCallableDirectly(
        "import { getFunctions } from 'firebase/functions';",
      ),
    ).toBe(false);
    expect(
      importsHttpsCallableDirectly(
        "import * as firebaseFunctions from 'firebase/functions';\nfirebaseFunctions.getFunctions();",
      ),
    ).toBe(false);
  });

  it('blocks new direct httpsCallable imports outside the wrapper and known debt', () => {
    const allowedFiles = [
      ALLOWED_WRAPPER_FILE,
      ...EXISTING_DIRECT_HTTPS_CALLABLE_IMPORT_DEBT,
    ].sort();

    expect(listDirectHttpsCallableImports()).toEqual(allowedFiles);
  });
});
