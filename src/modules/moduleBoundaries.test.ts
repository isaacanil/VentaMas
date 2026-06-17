import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

type ImportReference = {
  filePath: string;
  line: number;
  specifier: string;
};

type DeepModuleImportViolation = ImportReference & {
  consumerModule: string;
  targetModule: string;
};

type RestrictedSharedImportRule = {
  allowedFilePathPrefixes: string[];
  importPrefix: string;
};

const modulesRoot = path.join(process.cwd(), 'src', 'modules');
const sourceRoot = path.join(process.cwd(), 'src');
const routerRoot = path.join(process.cwd(), 'src', 'router');
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

const allowedLegacyDeepImports = new Set([]);

const publicModulePathImportPattern = /^@\/modules\/([^/]+)\/(.+)/;
const relativeImportPattern = /^\.\.?\//;

const allowedLegacyPrivateRouterImports = new Set([]);

const allowedDirectHeroUiReactImportPathPrefixes = [
  'src/components/heroui/',
  'src/modules/dev/',
];

const forbiddenLegacySharedImportPrefixes = [
  '@/ant',
  '@/components/modals',
  '@/components/Purchase',
  '@/components/DoctorModal',
  '@/components/DoctorSelector',
  '@/components/ui/Product',
  '@/components/ui/customProduct',
  '@/components/ui/client',
  '@/components/ui/Nav',
  '@/components/ui/WebName',
  '@/components/ui/InfoCard',
  '@/components/ui/AppModal',
  '@/components/ui/Button/OpenMenuButton',
  '@/components/ui/Button/EditDelBtns',
  '@/hooks/accountsReceivable',
  '@/hooks/barcode/useBarcodeScanner',
  '@/hooks/barcode/useBarcodeSettings',
  '@/hooks/creditNote',
  '@/hooks/product',
  '@/hooks/products',
  '@/hooks/useOrders',
  '@/hooks/usePurchases',
  '@/hooks/useRncSearch',
  '@/hooks/useAuthorizationModules',
  '@/hooks/useAuthorizationPin',
  '@/hooks/useInsuranceEnabled',
  '@/hooks/useFormatTime',
  '@/hooks/useLocationNames',
  '@/hooks/useStockAlertThresholds',
  '@/hooks/useProductStock',
  '@/hooks/useSearchFilter',
  '@/hooks/useVendorBills',
  '@/hooks/exportToExcel',
  '@/supabase',
  '@/firebase/Auth/fbAuthV2/fbSignIn/checkSession',
  '@/firebase/Auth/fbAuthV2/fbSignIn/components',
  '@/firebase/Auth/fbAuthV2/fbSignIn/updateUserData',
  '@/firebase/AppUpdate',
  '@/firebase/app/fbUpdateAppVersion',
  '@/firebase/debitNotes',
  '@/firebase/errors',
  '@/firebase/hrPayroll',
  '@/firebase/ProductOutflow',
  '@/firebase/treasury',
  '@/firebase/vendorBills',
  '@/types/debitNote',
  '@/utils/accountsReceivable/creditLimit',
  '@/utils/accountsReceivable/generateInstallments',
  '@/utils/accountsReceivable/getMaxInstallments',
  '@/utils/accountsReceivable/paymentDates',
  '@/utils/expenses/constants',
  '@/utils/expenses/validation/expenseValidate',
  '@/utils/vendorBills',
  '@/utils/import/product',
  '@/utils/inventory/constants',
  '@/utils/inventory/productStockSelection',
  '@/utils/invoice/electronicTaxReceipt',
  '@/utils/order/totals',
  '@/utils/purchase/receiptHistory',
  '@/utils/fiscal/electronicTaxReceiptDocumentTypes',
  '@/utils/fiscal/dgii608ReasonCatalog',
  '@/utils/commissions/collaboratorOptions',
  '@/services/accountsReceivable',
  '@/notification',
];

const restrictedSharedImportRules: RestrictedSharedImportRule[] = [
  {
    importPrefix: '@/utils/order/types',
    allowedFilePathPrefixes: ['src/modules/orderAndPurchase/'],
  },
];

const retiredLegacySharedSourcePaths = [
  ['src', 'ant'],
  ['src', 'components', 'modals'],
  ['src', 'components', 'Purchase'],
  ['src', 'components', 'DoctorModal'],
  ['src', 'components', 'DoctorSelector'],
  ['src', 'components', 'ui', 'Product'],
  ['src', 'components', 'ui', 'customProduct'],
  ['src', 'components', 'ui', 'client'],
  ['src', 'components', 'ui', 'Nav'],
  ['src', 'components', 'ui', 'WebName'],
  ['src', 'components', 'ui', 'InfoCard'],
  ['src', 'components', 'ui', 'AppModal'],
  ['src', 'components', 'ui', 'Button', 'OpenMenuButton.tsx'],
  ['src', 'components', 'ui', 'Button', 'EditDelBtns'],
  ['src', 'hooks', 'accountsReceivable'],
  ['src', 'hooks', 'barcode', 'useBarcodeScanner.tsx'],
  ['src', 'hooks', 'barcode', 'useBarcodeSettings.ts'],
  ['src', 'hooks', 'creditNote'],
  ['src', 'hooks', 'product'],
  ['src', 'hooks', 'products'],
  ['src', 'hooks', 'useOrders.tsx'],
  ['src', 'hooks', 'usePurchases.tsx'],
  ['src', 'hooks', 'useRncSearch.ts'],
  ['src', 'hooks', 'useRncSearch.test.ts'],
  ['src', 'hooks', 'useAuthorizationModules.ts'],
  ['src', 'hooks', 'useAuthorizationPin.ts'],
  ['src', 'hooks', 'useInsuranceEnabled.ts'],
  ['src', 'hooks', 'useFormatTime.tsx'],
  ['src', 'hooks', 'useLocationNames.ts'],
  ['src', 'hooks', 'useStockAlertThresholds.ts'],
  ['src', 'hooks', 'useProductStock.ts'],
  ['src', 'hooks', 'useSearchFilter.ts'],
  ['src', 'hooks', 'useVendorBills.tsx'],
  ['src', 'hooks', 'exportToExcel'],
  ['src', 'supabase'],
  ['src', 'firebase', 'Auth', 'fbAuthV2', 'fbSignIn', 'checkSession.ts'],
  ['src', 'firebase', 'Auth', 'fbAuthV2', 'fbSignIn', 'components'],
  ['src', 'firebase', 'Auth', 'fbAuthV2', 'fbSignIn', 'updateUserData.ts'],
  ['src', 'firebase', 'AppUpdate'],
  ['src', 'firebase', 'app', 'fbUpdateAppVersion.ts'],
  ['src', 'firebase', 'debitNotes'],
  ['src', 'firebase', 'errors'],
  ['src', 'firebase', 'hrPayroll'],
  ['src', 'firebase', 'ProductOutflow'],
  ['src', 'firebase', 'treasury'],
  ['src', 'firebase', 'vendorBills'],
  ['src', 'types', 'debitNote.ts'],
  ['src', 'utils', 'accountsReceivable', 'creditLimit.ts'],
  ['src', 'utils', 'accountsReceivable', 'creditLimit.test.ts'],
  ['src', 'utils', 'accountsReceivable', 'generateInstallments.ts'],
  ['src', 'utils', 'accountsReceivable', 'generateInstallments.test.ts'],
  ['src', 'utils', 'accountsReceivable', 'getMaxInstallments.ts'],
  ['src', 'utils', 'accountsReceivable', 'getMaxInstallments.test.ts'],
  ['src', 'utils', 'accountsReceivable', 'paymentDates.ts'],
  ['src', 'utils', 'accountsReceivable', 'paymentDates.test.ts'],
  ['src', 'utils', 'expenses', 'constants.ts'],
  ['src', 'utils', 'expenses', 'validation', 'expenseValidate.ts'],
  ['src', 'utils', 'expenses', 'validation', 'expenseValidate.test.ts'],
  ['src', 'utils', 'vendorBills'],
  ['src', 'utils', 'import', 'product'],
  ['src', 'utils', 'inventory', 'constants.ts'],
  ['src', 'utils', 'inventory', 'productStockSelection.ts'],
  ['src', 'utils', 'inventory', 'productStockSelection.test.ts'],
  ['src', 'utils', 'invoice', 'electronicTaxReceipt.ts'],
  ['src', 'utils', 'invoice', 'electronicTaxReceipt.test.ts'],
  ['src', 'utils', 'order', 'totals.ts'],
  ['src', 'utils', 'purchase', 'receiptHistory.ts'],
  ['src', 'utils', 'purchase', 'receiptHistory.test.ts'],
  ['src', 'utils', 'fiscal', 'electronicTaxReceiptDocumentTypes.ts'],
  ['src', 'utils', 'fiscal', 'electronicTaxReceiptDocumentTypes.test.ts'],
  ['src', 'utils', 'fiscal', 'dgii608ReasonCatalog.ts'],
  ['src', 'utils', 'fiscal', 'dgii608ReasonCatalog.test.ts'],
  ['src', 'utils', 'commissions', 'collaboratorOptions.ts'],
  ['src', 'services', 'accountsReceivable'],
  ['src', 'notification'],
];

const allowedLegacyModuleCycles = new Set([
  'accounting -> accountsReceivable -> accounting',
  'accounting -> accountsReceivable -> invoice -> accounting',
  'accountsPayable -> orderAndPurchase -> accountsPayable',
  'inventory -> navigation -> inventory',
]);

const toRepoPath = (filePath: string) =>
  path.relative(process.cwd(), filePath).replaceAll(path.sep, '/');

const getLine = (sourceFile: ts.SourceFile, node: ts.Node) =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

const createViolationKey = ({
  filePath,
  specifier,
}: Pick<ImportReference, 'filePath' | 'specifier'>) =>
  `${filePath} -> ${specifier}`;

const formatViolation = ({
  consumerModule,
  filePath,
  line,
  specifier,
  targetModule,
}: DeepModuleImportViolation) =>
  `${filePath}:${line} imports ${specifier} (${consumerModule} -> ${targetModule})`;

const formatPrivateRouterViolation = ({
  filePath,
  line,
  specifier,
  targetModule,
}: ImportReference & { targetModule: string }) =>
  `${filePath}:${line} imports ${specifier}; use @/modules/${targetModule}/public from router files`;

const createModuleCycleKey = (moduleCycle: string[]) =>
  [...moduleCycle, moduleCycle[0]].join(' -> ');

const normalizeModuleCycle = (moduleCycle: string[]) =>
  moduleCycle
    .map((_, index) =>
      createModuleCycleKey([
        ...moduleCycle.slice(index),
        ...moduleCycle.slice(0, index),
      ]),
    )
    .sort()[0];

const listPublicModuleNames = () =>
  new Set(
    readdirSync(modulesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((moduleName) =>
        existsSync(path.join(modulesRoot, moduleName, 'public.ts')),
      ),
  );

const isModulePublicEntry = (modulePath: string) =>
  modulePath === 'public' || modulePath.startsWith('public/');

const listSourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(entryPath);
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      return [entryPath];
    }

    return [];
  });

const collectImportReferencesFromSource = (
  filePath: string,
  source: string,
): ImportReference[] => {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const imports: ImportReference[] = [];

  const addImport = (moduleSpecifier: ts.StringLiteralLike) => {
    imports.push({
      filePath: toRepoPath(filePath),
      line: getLine(sourceFile, moduleSpecifier),
      specifier: moduleSpecifier.text,
    });
  };

  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      addImport(node.moduleSpecifier);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const [moduleSpecifier] = node.arguments;

      if (moduleSpecifier && ts.isStringLiteralLike(moduleSpecifier)) {
        addImport(moduleSpecifier);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return imports;
};

const collectAllImportReferences = (filePath: string): ImportReference[] =>
  collectImportReferencesFromSource(filePath, readFileSync(filePath, 'utf8'));

const collectImportReferences = (filePath: string): ImportReference[] => {
  const source = readFileSync(filePath, 'utf8');

  if (!source.includes('@/modules/')) {
    return [];
  }

  return collectImportReferencesFromSource(filePath, source);
};

const collectImportReferencesContaining = (
  filePath: string,
  marker: string,
): ImportReference[] => {
  const source = readFileSync(filePath, 'utf8');

  if (!source.includes(marker)) {
    return [];
  }

  return collectImportReferencesFromSource(filePath, source);
};

const findDeepModuleImportViolations = () =>
  listSourceFiles(modulesRoot).flatMap((filePath) => {
    const repoPath = toRepoPath(filePath);
    const [, , consumerModule] = repoPath.split('/');

    if (!consumerModule) {
      return [];
    }

    return collectImportReferences(filePath).flatMap((importReference) => {
      const moduleMatch = publicModulePathImportPattern.exec(
        importReference.specifier,
      );

      if (!moduleMatch) {
        return [];
      }

      const [, targetModule, modulePath] = moduleMatch;

      if (targetModule === consumerModule || isModulePublicEntry(modulePath)) {
        return [];
      }

      return [
        {
          ...importReference,
          consumerModule,
          targetModule,
        },
      ];
    });
  });

const findPrivateRouterModuleImportViolations = () => {
  const publicModuleNames = listPublicModuleNames();

  return listSourceFiles(routerRoot).flatMap((filePath) =>
    collectImportReferences(filePath).flatMap((importReference) => {
      const moduleMatch = publicModulePathImportPattern.exec(
        importReference.specifier,
      );

      if (!moduleMatch) {
        return [];
      }

      const [, targetModule, modulePath] = moduleMatch;

      if (
        !publicModuleNames.has(targetModule) ||
        isModulePublicEntry(modulePath)
      ) {
        return [];
      }

      return [
        {
          ...importReference,
          targetModule,
        },
      ];
    }),
  );
};

const importMatchesPrefix = (specifier: string, prefix: string) =>
  specifier === prefix || specifier.startsWith(`${prefix}/`);

const normalizeModulePath = (modulePath: string) =>
  modulePath.replace(/\.[cm]?[jt]sx?$/, '');

const isModulePublicImportPath = (modulePath: string) =>
  isModulePublicEntry(normalizeModulePath(modulePath));

const getModuleNameFromRepoPath = (repoPath: string) => {
  const [sourceDirectory, modulesDirectory, moduleName] = repoPath.split('/');

  if (sourceDirectory !== 'src' || modulesDirectory !== 'modules') {
    return null;
  }

  return moduleName ?? null;
};

const getModuleTargetFromRepoPath = (repoPath: string) => {
  const [sourceDirectory, modulesDirectory, moduleName, ...modulePathParts] =
    repoPath.split('/');

  if (
    sourceDirectory !== 'src' ||
    modulesDirectory !== 'modules' ||
    !moduleName ||
    modulePathParts.length === 0
  ) {
    return null;
  }

  return {
    moduleName,
    modulePath: modulePathParts.join('/'),
  };
};

const findPrivateModuleImportViolationsAcrossSource = () =>
  listSourceFiles(sourceRoot).flatMap((filePath) => {
    const repoPath = toRepoPath(filePath);
    const consumerModule = getModuleNameFromRepoPath(repoPath);

    return collectImportReferences(filePath).flatMap((importReference) => {
      const moduleMatch = publicModulePathImportPattern.exec(
        importReference.specifier,
      );

      if (!moduleMatch) {
        return [];
      }

      const [, targetModule, modulePath] = moduleMatch;

      if (
        targetModule === consumerModule ||
        isModulePublicImportPath(modulePath)
      ) {
        return [];
      }

      return [
        {
          ...importReference,
          consumerModule: consumerModule ?? '<outside modules>',
          targetModule,
        },
      ];
    });
  });

const findRelativeCrossModuleImportViolations = () =>
  listSourceFiles(sourceRoot).flatMap((filePath) => {
    const repoPath = toRepoPath(filePath);
    const consumerModule = getModuleNameFromRepoPath(repoPath);

    return collectAllImportReferences(filePath).flatMap((importReference) => {
      if (!relativeImportPattern.test(importReference.specifier)) {
        return [];
      }

      const targetRepoPath = toRepoPath(
        path.resolve(path.dirname(filePath), importReference.specifier),
      );
      const targetModule = getModuleTargetFromRepoPath(targetRepoPath);

      if (
        !targetModule ||
        targetModule.moduleName === consumerModule ||
        isModulePublicImportPath(targetModule.modulePath)
      ) {
        return [];
      }

      return [
        {
          ...importReference,
          consumerModule: consumerModule ?? '<outside modules>',
          targetModule: targetModule.moduleName,
          targetRepoPath,
        },
      ];
    });
  });

const findForbiddenLegacySharedImportViolations = () =>
  listSourceFiles(sourceRoot).flatMap((filePath) =>
    collectAllImportReferences(filePath).filter((importReference) =>
      forbiddenLegacySharedImportPrefixes.some((prefix) =>
        importMatchesPrefix(importReference.specifier, prefix),
      ),
    ),
  );

const findRestrictedSharedImportViolations = () =>
  listSourceFiles(sourceRoot).flatMap((filePath) => {
    const repoPath = toRepoPath(filePath);

    return restrictedSharedImportRules.flatMap(
      ({ allowedFilePathPrefixes, importPrefix }) =>
        collectImportReferencesContaining(filePath, importPrefix)
          .filter((importReference) =>
            importMatchesPrefix(importReference.specifier, importPrefix),
          )
          .filter(
            () =>
              !allowedFilePathPrefixes.some((allowedPrefix) =>
                repoPath.startsWith(allowedPrefix),
              ),
          ),
    );
  });

const findDirectHeroUiReactImportViolations = () =>
  listSourceFiles(sourceRoot)
    .flatMap((filePath) =>
      collectImportReferencesContaining(filePath, '@heroui/react').filter(
        (importReference) => importReference.specifier === '@heroui/react',
      ),
    )
    .filter(
      ({ filePath }) =>
        !allowedDirectHeroUiReactImportPathPrefixes.some((allowedPrefix) =>
          filePath.startsWith(allowedPrefix),
        ),
    );

const collectModuleDependencyGraph = () => {
  const graph = new Map<string, Set<string>>();
  const ensureModule = (moduleName: string) => {
    if (!graph.has(moduleName)) {
      graph.set(moduleName, new Set());
    }
  };

  listSourceFiles(modulesRoot).forEach((filePath) => {
    const repoPath = toRepoPath(filePath);
    const [, , consumerModule] = repoPath.split('/');

    if (!consumerModule) {
      return;
    }

    ensureModule(consumerModule);

    collectImportReferences(filePath).forEach((importReference) => {
      const moduleMatch = publicModulePathImportPattern.exec(
        importReference.specifier,
      );

      if (!moduleMatch) {
        return;
      }

      const [, targetModule] = moduleMatch;

      if (targetModule === consumerModule) {
        return;
      }

      ensureModule(targetModule);
      graph.get(consumerModule)?.add(targetModule);
    });
  });

  return graph;
};

const findModuleDependencyCycles = () => {
  const graph = collectModuleDependencyGraph();
  const moduleCycles = new Set<string>();

  const visitModule = (
    startModule: string,
    currentModule: string,
    visitedModules: Set<string>,
    modulePath: string[],
  ) => {
    [...(graph.get(currentModule) ?? [])].sort().forEach((targetModule) => {
      if (targetModule === startModule && modulePath.length > 1) {
        moduleCycles.add(normalizeModuleCycle(modulePath));
        return;
      }

      if (visitedModules.has(targetModule)) {
        return;
      }

      visitedModules.add(targetModule);
      visitModule(startModule, targetModule, visitedModules, [
        ...modulePath,
        targetModule,
      ]);
      visitedModules.delete(targetModule);
    });
  };

  [...graph.keys()].sort().forEach((moduleName) => {
    visitModule(moduleName, moduleName, new Set([moduleName]), [moduleName]);
  });

  return [...moduleCycles].sort();
};

describe('module boundaries', () => {
  it('blocks new deep imports into another module private folders', () => {
    const violations = findDeepModuleImportViolations();
    const violationKeys = new Set(violations.map(createViolationKey));
    const unapprovedDeepImports = violations
      .filter(
        (violation) =>
          !allowedLegacyDeepImports.has(createViolationKey(violation)),
      )
      .map(formatViolation)
      .sort();
    const staleAllowedLegacyDeepImports = [...allowedLegacyDeepImports]
      .filter((allowedImport) => !violationKeys.has(allowedImport))
      .sort();

    expect({
      staleAllowedLegacyDeepImports,
      unapprovedDeepImports,
    }).toEqual({
      staleAllowedLegacyDeepImports: [],
      unapprovedDeepImports: [],
    });
  }, 30_000);

  it('blocks new private router imports into modules with public barrels', () => {
    const violations = findPrivateRouterModuleImportViolations();
    const violationKeys = new Set(violations.map(createViolationKey));
    const unapprovedPrivateRouterImports = violations
      .filter(
        (violation) =>
          !allowedLegacyPrivateRouterImports.has(createViolationKey(violation)),
      )
      .map(formatPrivateRouterViolation)
      .sort();
    const staleAllowedLegacyPrivateRouterImports = [
      ...allowedLegacyPrivateRouterImports,
    ]
      .filter((allowedImport) => !violationKeys.has(allowedImport))
      .sort();

    expect({
      staleAllowedLegacyPrivateRouterImports,
      unapprovedPrivateRouterImports,
    }).toEqual({
      staleAllowedLegacyPrivateRouterImports: [],
      unapprovedPrivateRouterImports: [],
    });
  }, 30_000);

  it('blocks private module imports from any source area', () => {
    const violations = findPrivateModuleImportViolationsAcrossSource()
      .map(formatViolation)
      .sort();

    expect(violations).toEqual([]);
  }, 30_000);

  it('blocks relative imports across module private folders', () => {
    const violations = findRelativeCrossModuleImportViolations()
      .map(
        ({ consumerModule, filePath, line, specifier, targetModule }) =>
          `${filePath}:${line} imports ${specifier} (${consumerModule} -> ${targetModule}); use a public module barrel or a neutral shared contract`,
      )
      .sort();

    expect(violations).toEqual([]);
  }, 30_000);

  it('blocks imports from retired shared domain buckets', () => {
    const violations = findForbiddenLegacySharedImportViolations()
      .map(
        ({ filePath, line, specifier }) =>
          `${filePath}:${line} imports ${specifier}; move ownership to the domain module or a module public barrel`,
      )
      .sort();

    expect(violations).toEqual([]);
  }, 30_000);

  it('keeps retired shared domain bucket directories deleted', () => {
    const restoredLegacyPaths = retiredLegacySharedSourcePaths
      .map((segments) => path.join(process.cwd(), ...segments))
      .filter((legacyPath) => existsSync(legacyPath))
      .map(toRepoPath)
      .sort();

    expect(restoredLegacyPaths).toEqual([]);
  });

  it('keeps transitional shared imports scoped to their owning module', () => {
    const violations = findRestrictedSharedImportViolations()
      .map(
        ({ filePath, line, specifier }) =>
          `${filePath}:${line} imports ${specifier}; move or expose the contract before sharing it outside its owning module`,
      )
      .sort();

    expect(violations).toEqual([]);
  }, 30_000);

  it('routes HeroUI React imports through the local adapter layer', () => {
    const violations = findDirectHeroUiReactImportViolations()
      .map(
        ({ filePath, line }) =>
          `${filePath}:${line} imports @heroui/react; use @/components/heroui outside adapter/dev code`,
      )
      .sort();

    expect(violations).toEqual([]);
  }, 30_000);

  it('blocks new dependency cycles between modules', () => {
    const moduleCycles = findModuleDependencyCycles();
    const moduleCycleKeys = new Set(moduleCycles);
    const unapprovedModuleCycles = moduleCycles.filter(
      (moduleCycle) => !allowedLegacyModuleCycles.has(moduleCycle),
    );
    const staleAllowedLegacyModuleCycles = [...allowedLegacyModuleCycles]
      .filter((allowedCycle) => !moduleCycleKeys.has(allowedCycle))
      .sort();

    expect({
      staleAllowedLegacyModuleCycles,
      unapprovedModuleCycles,
    }).toEqual({
      staleAllowedLegacyModuleCycles: [],
      unapprovedModuleCycles: [],
    });
  }, 30_000);
});
