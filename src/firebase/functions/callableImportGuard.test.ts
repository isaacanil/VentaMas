import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const SRC_DIR = path.join(process.cwd(), 'src');
const ALLOWED_WRAPPER_FILE = 'src/firebase/functions/callable.ts';

// Existing migration debt. Remove entries as files move to createFirebaseCallable.
const EXISTING_DIRECT_HTTPS_CALLABLE_IMPORT_DEBT = [
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

const EXISTING_FIREBASE_FUNCTIONS_SDK_IMPORT_FILES = [
  ALLOWED_WRAPPER_FILE,
  'src/firebase/firebaseconfig.tsx',
  'src/modules/dev/pages/dev/AiBusinessSeeding/api/aiBusinessSeedingTargetFirebase.ts',
  ...EXISTING_DIRECT_HTTPS_CALLABLE_IMPORT_DEBT,
] as const;

const FIREBASE_FUNCTIONS_MODULE_PATTERN =
  String.raw`firebase\/(?:compat\/functions|functions(?:\/[^'"]+)?)`;
const FIREBASE_FUNCTIONS_NAMED_IMPORT_PATTERN = new RegExp(
  String.raw`import\s+(?:type\s+)?\{(?<imports>[\s\S]*?)\}\s+from\s*['"]${FIREBASE_FUNCTIONS_MODULE_PATTERN}['"];?`,
  'g',
);
const FIREBASE_FUNCTIONS_NAMESPACE_IMPORT_PATTERN = new RegExp(
  String.raw`import\s+\*\s+as\s+(?<namespace>[$A-Z_a-z][$\w]*)\s+from\s*['"]${FIREBASE_FUNCTIONS_MODULE_PATTERN}['"];?`,
  'g',
);
const FIREBASE_FUNCTIONS_DEFAULT_IMPORT_PATTERN = new RegExp(
  String.raw`import\s+(?<namespace>[$A-Z_a-z][$\w]*)\s+from\s*['"]${FIREBASE_FUNCTIONS_MODULE_PATTERN}['"];?`,
  'g',
);
const FIREBASE_FUNCTIONS_REQUIRE_PATTERN = new RegExp(
  String.raw`(?:const|let|var)\s+(?:(?<destructured>\{[\s\S]*?\})|(?<namespace>[$A-Z_a-z][$\w]*))\s*=\s*require\(\s*['"]${FIREBASE_FUNCTIONS_MODULE_PATTERN}['"]\s*\)`,
  'g',
);
const FIREBASE_FUNCTIONS_DYNAMIC_IMPORT_PATTERN =
  new RegExp(
    String.raw`import\(\s*['"]${FIREBASE_FUNCTIONS_MODULE_PATTERN}['"]\s*\)`,
  );
const FIREBASE_FUNCTIONS_SIDE_EFFECT_IMPORT_PATTERN = new RegExp(
  String.raw`import\s*['"]${FIREBASE_FUNCTIONS_MODULE_PATTERN}['"];?`,
  'g',
);
const FIREBASE_FUNCTIONS_BARE_REQUIRE_PATTERN = new RegExp(
  String.raw`require\(\s*['"]${FIREBASE_FUNCTIONS_MODULE_PATTERN}['"]\s*\)`,
  'g',
);

const RUNTIME_SOURCE_PATTERN = /\.[cm]?[jt]sx?$/;
const SKIPPED_SOURCE_PATTERN =
  /\.(test|spec|stories)\.[cm]?[jt]sx?$/;

const normalizeSourcePath = (filePath: string) =>
  path.relative(process.cwd(), filePath).replaceAll(path.sep, '/');

const matchesPattern = (pattern: RegExp, text: string) => {
  pattern.lastIndex = 0;
  return pattern.test(text);
};

const collectMatches = (pattern: RegExp, text: string) => {
  pattern.lastIndex = 0;
  return Array.from(text.matchAll(pattern));
};

const importsFirebaseFunctionsSdk = (text: string) =>
  [
    FIREBASE_FUNCTIONS_NAMED_IMPORT_PATTERN,
    FIREBASE_FUNCTIONS_NAMESPACE_IMPORT_PATTERN,
    FIREBASE_FUNCTIONS_DEFAULT_IMPORT_PATTERN,
    FIREBASE_FUNCTIONS_REQUIRE_PATTERN,
    FIREBASE_FUNCTIONS_DYNAMIC_IMPORT_PATTERN,
    FIREBASE_FUNCTIONS_SIDE_EFFECT_IMPORT_PATTERN,
    FIREBASE_FUNCTIONS_BARE_REQUIRE_PATTERN,
  ].some((pattern) => matchesPattern(pattern, text));

const hasHttpsCallableMemberAccess = (text: string, namespace: string) => {
  const escapedNamespace = namespace.replaceAll('$', '\\$');
  return new RegExp(`\\b${escapedNamespace}\\s*\\.\\s*httpsCallable\\b`).test(
    text,
  );
};

const importsHttpsCallableDirectly = (text: string) => {
  const hasNamedImport = collectMatches(
    FIREBASE_FUNCTIONS_NAMED_IMPORT_PATTERN,
    text,
  ).some((match) => /\bhttpsCallable\b/.test(match.groups?.imports ?? ''));

  if (hasNamedImport) {
    return true;
  }

  const hasNamespaceImport = collectMatches(
    FIREBASE_FUNCTIONS_NAMESPACE_IMPORT_PATTERN,
    text,
  ).some((match) =>
    hasHttpsCallableMemberAccess(text, match.groups?.namespace ?? ''),
  );

  if (hasNamespaceImport) {
    return true;
  }

  const hasDefaultImport = collectMatches(
    FIREBASE_FUNCTIONS_DEFAULT_IMPORT_PATTERN,
    text,
  ).some((match) =>
    hasHttpsCallableMemberAccess(text, match.groups?.namespace ?? ''),
  );

  if (hasDefaultImport) {
    return true;
  }

  const hasRequireImport = collectMatches(
    FIREBASE_FUNCTIONS_REQUIRE_PATTERN,
    text,
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

const listFirebaseFunctionsSdkImports = () =>
  listRuntimeSourceFiles(SRC_DIR)
    .map((filePath) => ({
      sourcePath: normalizeSourcePath(filePath),
      text: readFileSync(filePath, 'utf8'),
    }))
    .filter(({ text }) => importsFirebaseFunctionsSdk(text))
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
    [
      'compat import',
      "import { httpsCallable } from 'firebase/compat/functions';",
    ],
    [
      'subpath import',
      "import { httpsCallable } from 'firebase/functions/internal';",
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

  it.each([
    ['named import', "import { getFunctions } from 'firebase/functions';"],
    ['type import', "import type { Functions } from 'firebase/functions';"],
    [
      'namespace import',
      "import * as firebaseFunctions from 'firebase/functions';",
    ],
    ['default import', "import firebaseFunctions from 'firebase/functions';"],
    [
      'destructured require',
      "const { getFunctions } = require('firebase/functions');",
    ],
    [
      'namespace require',
      "const firebaseFunctions = require('firebase/functions');",
    ],
    ['bare require', "require('firebase/functions').httpsCallable();"],
    [
      'dynamic import',
      "const firebaseFunctions = await import('firebase/functions');",
    ],
    ['side-effect import', "import 'firebase/functions';"],
    [
      'compat import',
      "import { getFunctions } from 'firebase/compat/functions';",
    ],
    [
      'subpath import',
      "import { getFunctions } from 'firebase/functions/internal';",
    ],
  ])('detects raw firebase/functions SDK import through %s', (_name, source) => {
    expect(importsFirebaseFunctionsSdk(source)).toBe(true);
  });

  it('blocks new direct httpsCallable imports outside the wrapper and known debt', () => {
    const allowedFiles = [
      ALLOWED_WRAPPER_FILE,
      ...EXISTING_DIRECT_HTTPS_CALLABLE_IMPORT_DEBT,
    ].sort();

    expect(listDirectHttpsCallableImports()).toEqual(allowedFiles);
  });

  it('blocks new firebase/functions SDK imports outside central wrappers and known debt', () => {
    expect(listFirebaseFunctionsSdkImports()).toEqual(
      [...EXISTING_FIREBASE_FUNCTIONS_SDK_IMPORT_FILES].sort(),
    );
  });
});
