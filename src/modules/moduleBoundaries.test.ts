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
const importReferencesByFilePath = new Map<string, ImportReference[]>();
const sourceFilesByDirectory = new Map<string, string[]>();

const allowedLegacyDeepImports = new Set([]);

const moduleRootImportPattern = /^@\/modules\/([^/]+)$/;
const publicModulePathImportPattern = /^@\/modules\/([^/]+)\/(.+)/;
const relativeImportPattern = /^\.\.?\//;

const allowedLegacyPrivateRouterImports = new Set([]);

const allowedDirectHeroUiReactImportPathPrefixes = [
  'src/components/heroui/',
  'src/modules/dev/',
];

const forbiddenDomainInfrastructureImportPrefixes = [
  '@/components',
  '@/features',
  '@/firebase',
  '@/hooks',
  '@/modules',
  '@/router',
  '@/styles',
  'firebase',
  'react',
  'react-dom',
];

const forbiddenDomainInfrastructureSourcePathPrefixes = [
  'src/components/',
  'src/features/',
  'src/firebase/',
  'src/hooks/',
  'src/modules/',
  'src/router/',
  'src/styles/',
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
  '@/components/ui/Inputs/CustomInput',
  '@/components/ui/Transition',
  '@/components/common/ThankYouMessage/ThankYouMessage',
  '@/hooks/accountsReceivable',
  '@/hooks/windows',
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
  '@/features/uploadImg',
  '@/features/barcodePrintModalSlice',
  '@/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/components/Bars',
  '@/features/auth/useBusinessDataConfig',
  '@/features/noteModal/components/NoteModal',
  '@/features/notification/notificationCenterSlice',
  '@/features/productBrands',
  '@/layouts',
  '@/config/fiscalReceiptsAlertConfig',
  '@/config/statusActionConfig',
  '@/constants/appConfig',
  '@/domain/banking/useBankInstitutionCatalog',
  '@/domain/devtools',
  '@/models/Warehouse/ProductStock',
  '@/models/Warehouse/Sale',
  '@/supabase',
  '@/firebase/Auth/fbAuthV2/fbCheckIfUserExists',
  '@/firebase/Auth/fbAuthV2/fbSignIn/checkSession',
  '@/firebase/Auth/fbAuthV2/fbSignIn/components',
  '@/firebase/Auth/fbAuthV2/fbSignIn/updateUserData',
  '@/firebase/Auth/fbAuthV2/types',
  '@/firebase/Auth/types',
  '@/firebase/Auth/userData',
  '@/firebase/AppUpdate',
  '@/firebase/app/fbUpdateAppVersion',
  '@/firebase/client/clients',
  '@/firebase/debitNotes',
  '@/firebase/errors',
  '@/firebase/functions/invoice/processInvoice',
  '@/firebase/hrPayroll',
  '@/firebase/inventoryDataCleaner',
  '@/firebase/purchase/addPurchaseImg',
  '@/firebase/ProductOutflow',
  '@/firebase/provider/fbGetProviderFromReference',
  '@/firebase/taxReceipt/taxReceiptTemplates',
  '@/firebase/Tools/getDocRef',
  '@/firebase/treasury',
  '@/firebase/vendorBills',
  '@/motion',
  '@/components/ui/AdvancedTable/Doc',
  '@/constants/devtools/developerShortcuts',
  '@/constants/paymentDescriptions',
  '@/constants/unitsOfMeasure',
  '@/types/commissions',
  '@/types/debitNote',
  '@/utils/accountsReceivable/creditLimit',
  '@/utils/accountsReceivable/generateInstallments',
  '@/utils/accountsReceivable/getMaxInstallments',
  '@/utils/accountsReceivable/paymentDates',
  '@/utils/expenses/constants',
  '@/utils/expenses/validation/expenseValidate',
  '@/utils/fileUtils',
  '@/utils/vendorBills',
  '@/utils/import/product',
  '@/utils/inventory/constants',
  '@/utils/inventory/productStockSelection',
  '@/utils/invoice/electronicTaxReceipt',
  '@/utils/order/totals',
  '@/utils/purchase/receiptHistory',
  '@/utils/provider/types',
  '@/utils/reactScan',
  '@/utils/fiscal/electronicTaxReceiptDocumentTypes',
  '@/utils/fiscal/dgii608ReasonCatalog',
  '@/utils/commissions/collaboratorOptions',
  '@/schema',
  '@/notification',
];

const restrictedSharedImportRules: RestrictedSharedImportRule[] = [
  {
    importPrefix: '@/components/ui/Button/Button',
    allowedFilePathPrefixes: ['src/components/ui/Button/'],
  },
  {
    importPrefix: '@/components/ui/Button/ButtonGroup',
    allowedFilePathPrefixes: ['src/components/ui/Button/'],
  },
  {
    importPrefix: '@/components/ui/Button/ButtonIconMenu',
    allowedFilePathPrefixes: ['src/components/ui/Button/'],
  },
  {
    importPrefix: '@/components/ui/Button/DeleteButton',
    allowedFilePathPrefixes: ['src/components/ui/Button/'],
  },
  {
    importPrefix: '@/components/ui/Button/EditButton',
    allowedFilePathPrefixes: ['src/components/ui/Button/'],
  },
  {
    importPrefix: '@/components/ui/Button/GoBackButton',
    allowedFilePathPrefixes: ['src/components/ui/Button/'],
  },
  {
    importPrefix: '@/components/ui/Button/PlusIconButton',
    allowedFilePathPrefixes: ['src/components/ui/Button/'],
  },
  {
    importPrefix: '@/components/ui/Button/Tooltip',
    allowedFilePathPrefixes: ['src/components/ui/Button/'],
  },
  {
    importPrefix: '@/components/ui/Button/types',
    allowedFilePathPrefixes: ['src/components/ui/Button/'],
  },
  {
    importPrefix: '@/components/ui/Typography/Typography',
    allowedFilePathPrefixes: ['src/components/ui/Typography/'],
  },
  {
    importPrefix: '@/components/ui/Typography/SimpleTypography',
    allowedFilePathPrefixes: ['src/components/ui/Typography/'],
  },
  {
    importPrefix: '@/components/ui/Typography/types',
    allowedFilePathPrefixes: ['src/components/ui/Typography/'],
  },
  {
    importPrefix: '@/components/ui/Typography/style',
    allowedFilePathPrefixes: ['src/components/ui/Typography/'],
  },
  {
    importPrefix: '@/components/ui/FormattedValue/FormattedValue',
    allowedFilePathPrefixes: ['src/components/ui/FormattedValue/'],
  },
  {
    importPrefix: '@/components/ui/FormattedValue/types',
    allowedFilePathPrefixes: ['src/components/ui/FormattedValue/'],
  },
  {
    importPrefix: '@/components/ui/Select/Select',
    allowedFilePathPrefixes: ['src/components/ui/Select/'],
  },
  {
    importPrefix: '@/components/ui/Select/Select.styles',
    allowedFilePathPrefixes: ['src/components/ui/Select/'],
  },
  {
    importPrefix: '@/components/ui/Select/Select.utils',
    allowedFilePathPrefixes: ['src/components/ui/Select/'],
  },
  {
    importPrefix: '@/components/ui/DropdownMenu/DropdownMenu',
    allowedFilePathPrefixes: ['src/components/ui/DropdownMenu/'],
  },
  {
    importPrefix: '@/components/ui/DropdownMenu/Option',
    allowedFilePathPrefixes: ['src/components/ui/DropdownMenu/'],
  },
  {
    importPrefix: '@/components/ui/DropdownMenu/types',
    allowedFilePathPrefixes: ['src/components/ui/DropdownMenu/'],
  },
  {
    importPrefix: '@/components/ui/Tag/Tag',
    allowedFilePathPrefixes: ['src/components/ui/Tag/'],
  },
  {
    importPrefix: '@/components/ui/Tag/Tag.styles',
    allowedFilePathPrefixes: ['src/components/ui/Tag/'],
  },
  {
    importPrefix: '@/components/ui/AnimatedNumber/AnimatedNumber',
    allowedFilePathPrefixes: ['src/components/ui/AnimatedNumber/'],
  },
  {
    importPrefix: '@/components/ui/Grid/Grid',
    allowedFilePathPrefixes: ['src/components/ui/Grid/'],
  },
  {
    importPrefix: '@/components/ui/message/Message',
    allowedFilePathPrefixes: ['src/components/ui/message/'],
  },
  {
    importPrefix: '@/components/ui/highlight/Highlight',
    allowedFilePathPrefixes: ['src/components/ui/highlight/'],
  },
  {
    importPrefix: '@/components/ui/statusDisplay/statusDisplayConfig',
    allowedFilePathPrefixes: [
      'src/components/ui/statusDisplay/',
      'src/components/ui/AdvancedTable/',
    ],
  },
  {
    importPrefix: '@/components/common/Badge/Badge',
    allowedFilePathPrefixes: ['src/components/common/Badge/'],
  },
  {
    importPrefix: '@/components/common/Modal/Modal',
    allowedFilePathPrefixes: ['src/components/common/Modal/'],
  },
  {
    importPrefix: '@/components/common/Modal/ModalShell',
    allowedFilePathPrefixes: ['src/components/common/Modal/'],
  },
  {
    importPrefix: '@/components/common/Modal/LegacyMotionModal',
    allowedFilePathPrefixes: ['src/components/common/Modal/'],
  },
  {
    importPrefix: '@/components/ui/loader/GenericLoader',
    allowedFilePathPrefixes: ['src/components/ui/loader/'],
  },
  {
    importPrefix: '@/components/ui/loader/Loader',
    allowedFilePathPrefixes: ['src/components/ui/loader/'],
  },
  {
    importPrefix: '@/components/ui/ShowCase/ShowCase',
    allowedFilePathPrefixes: ['src/components/ui/ShowCase/'],
  },
  {
    importPrefix: '@/components/ui/ShowCase/ShowcaseList',
    allowedFilePathPrefixes: ['src/components/ui/ShowCase/'],
  },
  {
    importPrefix: '@/components/ui/Inputs/GeneralInput',
    allowedFilePathPrefixes: ['src/components/ui/Inputs/'],
  },
  {
    importPrefix: '@/components/ui/Inputs/InputWithHorizontalLabel',
    allowedFilePathPrefixes: ['src/components/ui/Inputs/'],
  },
  {
    importPrefix: '@/components/ui/AdvancedTable/AdvancedTable',
    allowedFilePathPrefixes: ['src/components/ui/AdvancedTable/'],
  },
  {
    importPrefix: '@/components/ui/AdvancedTable/components',
    allowedFilePathPrefixes: ['src/components/ui/AdvancedTable/'],
  },
  {
    importPrefix: '@/components/ui/AdvancedTable/hooks',
    allowedFilePathPrefixes: ['src/components/ui/AdvancedTable/'],
  },
  {
    importPrefix: '@/components/ui/AdvancedTable/types',
    allowedFilePathPrefixes: ['src/components/ui/AdvancedTable/'],
  },
  {
    importPrefix: '@/components/charts/LazyCharts',
    allowedFilePathPrefixes: ['src/components/charts/'],
  },
  {
    importPrefix: '@/components/charts/barChartData',
    allowedFilePathPrefixes: ['src/components/charts/'],
  },
  {
    importPrefix: '@/components/charts/currencyBarChartOptions',
    allowedFilePathPrefixes: ['src/components/charts/'],
  },
  {
    importPrefix: '@/components/charts/chartTypes',
    allowedFilePathPrefixes: ['src/components/charts/'],
  },
  {
    importPrefix: '@/components/charts/loadChart',
    allowedFilePathPrefixes: ['src/components/charts/'],
  },
  {
    importPrefix: '@/utils/order/types',
    allowedFilePathPrefixes: ['src/modules/orderAndPurchase/'],
  },
];

const retiredLegacySharedSourcePaths = [
  ['src', 'stories'],
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
  ['src', 'components', 'ui', 'Inputs', 'CustomInput.tsx'],
  ['src', 'components', 'ui', 'Inputs', 'CustomInput.styles.ts'],
  ['src', 'components', 'ui', 'AdvancedTable', 'Doc.tsx'],
  ['src', 'components', 'ui', 'Transition.tsx'],
  [
    'src',
    'modules',
    'invoice',
    'pages',
    'InvoicesPage',
    'SalesAnalyticsPanel',
    'components',
    'Bars',
  ],
  ['src', 'firebase', 'taxReceipt', 'taxReceiptTemplates.ts'],
  [
    'src',
    'modules',
    'hrPayroll',
    'pages',
    'HrCommissionPeriodsPage',
    'components',
    'HrCommissionCutRulePicker',
  ],
  [
    'src',
    'modules',
    'dev',
    'pages',
    'dev',
    'AiBusinessSeeding',
    'components',
    'CanvasPanel.tsx',
  ],
  [
    'src',
    'modules',
    'dev',
    'pages',
    'dev',
    'AiBusinessSeeding',
    'api',
    'fbSeedBusinessWithUsers.ts',
  ],
  [
    'src',
    'modules',
    'dev',
    'pages',
    'test',
    'pages',
    'checkProductPriceField',
    'CheckProductPriceField.tsx',
  ],
  [
    'src',
    'modules',
    'dev',
    'pages',
    'test',
    'pages',
    'checkProductPriceField',
    'BusinessPriceAudit.tsx',
  ],
  [
    'src',
    'modules',
    'dev',
    'pages',
    'test',
    'pages',
    'checkProductPriceField',
  ],
  ['src', 'modules', 'products', 'components', 'ProductListSelected'],
  ['src', 'modules', 'sales', 'components', 'Receipts', 'Sale', 'Template2'],
  ['src', 'hooks', 'accountsReceivable'],
  ['src', 'hooks', 'windows'],
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
  ['src', 'features', 'uploadImg'],
  ['src', 'features', 'barcodePrintModalSlice'],
  ['src', 'features', 'customProducts', 'emptyData.ts'],
  ['src', 'features', 'auth', 'useBusinessDataConfig.ts'],
  ['src', 'features', 'noteModal', 'components'],
  ['src', 'features', 'noteModal', 'components', 'NoteModal.tsx'],
  ['src', 'features', 'notification', 'notificationCenterSlice.ts'],
  ['src', 'features', 'productBrands'],
  ['src', 'layouts'],
  ['src', 'config'],
  ['src', 'config', 'statusActionConfig.tsx'],
  ['src', 'constants', 'appConfig.ts'],
  ['src', 'constants', 'devtools'],
  ['src', 'domain', 'banking', 'useBankInstitutionCatalog.ts'],
  ['src', 'domain', 'devtools'],
  ['src', 'models', 'Warehouse', 'ProductStock.ts'],
  ['src', 'models', 'Warehouse', 'Sale.ts'],
  [
    'src',
    'modules',
    'navigation',
    'components',
    'MenuApp',
    'components',
    'SearchProductBar.tsx',
  ],
  ['src', 'supabase'],
  ['src', 'firebase', 'Auth', 'fbAuthV2', 'fbCheckIfUserExists.ts'],
  ['src', 'firebase', 'Auth', 'fbAuthV2', 'fbSignIn', 'checkSession.ts'],
  ['src', 'firebase', 'Auth', 'fbAuthV2', 'fbSignIn', 'components'],
  ['src', 'firebase', 'Auth', 'fbAuthV2', 'fbSignIn', 'updateUserData.ts'],
  ['src', 'firebase', 'Auth', 'fbAuthV2', 'types.ts'],
  ['src', 'firebase', 'Auth', 'types.ts'],
  ['src', 'firebase', 'Auth', 'userData.ts'],
  ['src', 'firebase', 'AppUpdate'],
  ['src', 'firebase', 'app', 'fbUpdateAppVersion.ts'],
  ['src', 'firebase', 'client', 'clients.ts'],
  ['src', 'firebase', 'debitNotes'],
  ['src', 'firebase', 'errors'],
  ['src', 'firebase', 'functions', 'invoice', 'processInvoice.ts'],
  ['src', 'firebase', 'functions', 'inventory', 'reconcileBatchStatus.ts'],
  ['src', 'firebase', 'hrPayroll'],
  ['src', 'firebase', 'inventoryDataCleaner'],
  ['src', 'firebase', 'purchase', 'addPurchaseImg.ts'],
  ['src', 'firebase', 'purchase', 'deletePurchaseImg.ts'],
  ['src', 'firebase', 'ProductOutflow'],
  ['src', 'firebase', 'provider', 'fbGetProviderFromReference.ts'],
  ['src', 'firebase', 'Tools', 'getDocRef.ts'],
  ['src', 'firebase', 'treasury'],
  ['src', 'firebase', 'vendorBills'],
  ['src', 'motion'],
  ['src', 'constants', 'paymentDescriptions.ts'],
  ['src', 'constants', 'unitsOfMeasure.ts'],
  ['src', 'types', 'commissions.ts'],
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
  ['src', 'utils', 'fileUtils.ts'],
  ['src', 'utils', 'vendorBills'],
  ['src', 'utils', 'import', 'product'],
  ['src', 'utils', 'inventory', 'constants.ts'],
  ['src', 'utils', 'inventory', 'productStockSelection.ts'],
  ['src', 'utils', 'inventory', 'productStockSelection.test.ts'],
  ['src', 'utils', 'invoice', 'electronicTaxReceipt.ts'],
  ['src', 'utils', 'invoice', 'electronicTaxReceipt.test.ts'],
  ['src', 'utils', 'pdf', 'pdfMakeLoader.ts'],
  ['src', 'utils', 'order', 'totals.ts'],
  ['src', 'utils', 'purchase', 'receiptHistory.ts'],
  ['src', 'utils', 'purchase', 'receiptHistory.test.ts'],
  ['src', 'utils', 'provider'],
  ['src', 'utils', 'reactScan.ts'],
  ['src', 'utils', 'fiscal', 'electronicTaxReceiptDocumentTypes.ts'],
  ['src', 'utils', 'fiscal', 'electronicTaxReceiptDocumentTypes.test.ts'],
  ['src', 'utils', 'fiscal', 'dgii608ReasonCatalog.ts'],
  ['src', 'utils', 'fiscal', 'dgii608ReasonCatalog.test.ts'],
  ['src', 'utils', 'commissions', 'collaboratorOptions.ts'],
  ['src', 'services', 'functionsApiClient.ts'],
  ['src', 'services', 'functionsApiClient.test.ts'],
  ['src', 'services', 'dynamicPermissions.ts'],
  ['src', 'services', 'dynamicPermissions.test.ts'],
  ['src', 'services', 'invoice', 'invoiceV2Admin.service.ts'],
  ['src', 'services', 'accountsReceivable'],
  ['src', 'schema'],
  ['src', 'modules', 'settings', 'pages', 'setting', 'components'],
  [
    'src',
    'modules',
    'settings',
    'pages',
    'setting',
    'components',
    'SettingCategorySection',
  ],
  [
    'src',
    'modules',
    'settings',
    'pages',
    'setting',
    'components',
    'SettingSearch',
  ],
  ['src', 'modules', 'settings', 'pages', 'setting', 'hooks'],
  ['src', 'modules', 'settings', 'pages', 'setting', 'utils'],
  ['src', 'styles', 'insurance.css'],
  ['src', 'styles', 'variables.css'],
  ['src', 'notification'],
  [
    'src',
    'modules',
    'home',
    'pages',
    'Home',
    'components',
    'PersonalizedGreeting',
    'components',
    'BusinessName.tsx',
  ],
  [
    'src',
    'modules',
    'home',
    'pages',
    'Home',
    'components',
    'PersonalizedGreeting',
    'components',
    'BusinessPill.tsx',
  ],
  [
    'src',
    'modules',
    'home',
    'pages',
    'Home',
    'components',
    'PersonalizedGreeting',
    'components',
    'GreetingMessage.tsx',
  ],
  [
    'src',
    'modules',
    'home',
    'pages',
    'Home',
    'components',
    'PersonalizedGreeting',
    'components',
    'UserPill.tsx',
  ],
  [
    'src',
    'modules',
    'insurance',
    'pages',
    'Insurance',
    'components',
    'InsuranceStateIndicator',
    'InsuranceStateIndicator.tsx',
  ],
  [
    'src',
    'modules',
    'cashReconciliation',
    'pages',
    'CashReconciliation',
    'components',
    'Body',
    'components',
    'FilterBar.tsx',
  ],
  [
    'src',
    'modules',
    'sales',
    'pages',
    'Sale',
    'components',
    'PreorderQuickActions.tsx',
  ],
  [
    'src',
    'modules',
    'sales',
    'pages',
    'Sale',
    'components',
    'Cart',
    'components',
    'InvoicePanel',
    'constants',
    'modalStyles.ts',
  ],
];

const allowedLegacyGlobalServiceSourcePaths = new Set([
  'src/services/invoice/autoCompletePreorderInvoice.ts',
  'src/services/invoice/invoice.service.ts',
  'src/services/invoice/logInvoiceAuthorizations.ts',
  'src/services/invoice/types.ts',
  'src/services/invoice/useInvoice.ts',
  'src/services/invoice/utils/electronicInvoiceReadiness.test.ts',
  'src/services/invoice/utils/electronicInvoiceReadiness.ts',
]);

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

const isModulePublicEntry = (modulePath: string) => modulePath === 'public';

const listSourceFiles = (directory: string): string[] => {
  const cachedFiles = sourceFilesByDirectory.get(directory);
  if (cachedFiles) return cachedFiles;

  const files = readdirSync(directory, { withFileTypes: true }).flatMap(
    (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listSourceFiles(entryPath);
      }

      if (sourceExtensions.has(path.extname(entry.name))) {
        return [entryPath];
      }

      return [];
    },
  );
  sourceFilesByDirectory.set(directory, files);
  return files;
};

const isRequireModuleReferenceCall = (node: ts.CallExpression) => {
  if (ts.isIdentifier(node.expression)) {
    return node.expression.text === 'require';
  }

  return (
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'resolve' &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === 'require'
  );
};

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

    if (ts.isCallExpression(node) && isRequireModuleReferenceCall(node)) {
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

const collectAllImportReferences = (filePath: string): ImportReference[] => {
  const cachedImports = importReferencesByFilePath.get(filePath);
  if (cachedImports) return cachedImports;

  const imports = collectImportReferencesFromSource(
    filePath,
    readFileSync(filePath, 'utf8'),
  );
  importReferencesByFilePath.set(filePath, imports);
  return imports;
};

const collectImportReferences = (filePath: string): ImportReference[] => {
  const source = readFileSync(filePath, 'utf8');

  if (!source.includes('@/modules/')) {
    return [];
  }

  return collectAllImportReferences(filePath);
};

const collectImportReferencesContaining = (
  filePath: string,
  marker: string,
): ImportReference[] => {
  const source = readFileSync(filePath, 'utf8');

  if (!source.includes(marker)) {
    return [];
  }

  return collectAllImportReferences(filePath);
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

const findModuleRootImportViolations = () =>
  listSourceFiles(sourceRoot).flatMap((filePath) =>
    collectImportReferencesContaining(filePath, '@/modules/').flatMap(
      (importReference) => {
        const moduleMatch = moduleRootImportPattern.exec(
          importReference.specifier,
        );

        if (!moduleMatch) {
          return [];
        }

        const [, targetModule] = moduleMatch;

        return [
          {
            ...importReference,
            targetModule,
          },
        ];
      },
    ),
  );

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

const listLegacyGlobalServiceSourceFiles = () => {
  const servicesRoot = path.join(sourceRoot, 'services');
  if (!existsSync(servicesRoot)) return [];

  return listSourceFiles(servicesRoot).map(toRepoPath).sort();
};

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

const resolvesToForbiddenDomainInfrastructurePath = (
  filePath: string,
  importSpecifier: string,
) => {
  if (!relativeImportPattern.test(importSpecifier)) {
    return false;
  }

  const resolvedRepoPath = `${toRepoPath(
    path.resolve(path.dirname(filePath), importSpecifier),
  )}/`;

  return forbiddenDomainInfrastructureSourcePathPrefixes.some((prefix) =>
    resolvedRepoPath.startsWith(prefix),
  );
};

const findDomainInfrastructureImportViolations = () => {
  const domainRoot = path.join(sourceRoot, 'domain');

  return listSourceFiles(domainRoot).flatMap((filePath) =>
    collectAllImportReferences(filePath).filter((importReference) => {
      const importsForbiddenPrefix =
        forbiddenDomainInfrastructureImportPrefixes.some((prefix) =>
          importMatchesPrefix(importReference.specifier, prefix),
        );

      return (
        importsForbiddenPrefix ||
        resolvesToForbiddenDomainInfrastructurePath(
          filePath,
          importReference.specifier,
        )
      );
    }),
  );
};

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
  it('collects CommonJS require references for boundary checks', () => {
    const imports = collectImportReferencesFromSource(
      path.join(process.cwd(), 'src', 'modules', 'sample.ts'),
      [
        "const invoice = require('@/modules/invoice/private');",
        "const productsPath = require.resolve('@/modules/products/public');",
      ].join('\n'),
    );

    expect(imports).toEqual([
      {
        filePath: 'src/modules/sample.ts',
        line: 1,
        specifier: '@/modules/invoice/private',
      },
      {
        filePath: 'src/modules/sample.ts',
        line: 2,
        specifier: '@/modules/products/public',
      },
    ]);
  });

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

  it('blocks root module imports that bypass public barrels', () => {
    const violations = findModuleRootImportViolations()
      .map(
        ({ filePath, line, specifier, targetModule }) =>
          `${filePath}:${line} imports ${specifier}; use @/modules/${targetModule}/public or an explicit neutral contract`,
      )
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

  it('keeps src/services frozen to the characterized invoice legacy surface', () => {
    const serviceSourceFiles = listLegacyGlobalServiceSourceFiles();
    const unexpectedGlobalServices = serviceSourceFiles
      .filter(
        (servicePath) => !allowedLegacyGlobalServiceSourcePaths.has(servicePath),
      )
      .sort();
    const staleAllowedLegacyGlobalServices = [
      ...allowedLegacyGlobalServiceSourcePaths,
    ]
      .filter((servicePath) => !serviceSourceFiles.includes(servicePath))
      .sort();

    expect({
      staleAllowedLegacyGlobalServices,
      unexpectedGlobalServices,
    }).toEqual({
      staleAllowedLegacyGlobalServices: [],
      unexpectedGlobalServices: [],
    });
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

  it('keeps domain contracts free from UI, routing, and Firebase infrastructure', () => {
    const violations = findDomainInfrastructureImportViolations()
      .map(
        ({ filePath, line, specifier }) =>
          `${filePath}:${line} imports ${specifier}; keep src/domain pure and move UI, routing, or Firebase adapters to hooks, repositories, or modules`,
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
