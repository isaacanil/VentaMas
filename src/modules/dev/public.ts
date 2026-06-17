export const loadAccountingPilotAuditRoute = () =>
  import('./pages/DevTools/AccountingPilotAudit/AccountingPilotAudit');

export const loadAiBusinessSeedingRoute = () =>
  import('./pages/dev/AiBusinessSeeding/AiBusinessSeeding');

export const loadBSeriesInvoicesRoute = () =>
  import('./pages/DevTools/BSeriesInvoices/BSeriesInvoices');

export const loadCashCountAuditRoute = () =>
  import('./pages/DevTools/CashCountAudit/CashCountAudit');

export const loadCustomHeroUiPlaygroundRoute = () =>
  import('./pages/DevTools/CustomHeroUiPlayground/CustomHeroUiPlayground');

export const loadDeveloperConsoleModal = () =>
  import('./components/DeveloperConsoleModal/DeveloperModal');

export const loadElectronicTaxReceiptProviderConfigRoute = () =>
  import(
    './pages/DevTools/ElectronicTaxReceiptProvider/ElectronicTaxReceiptProviderConfigPage'
  );

export const loadErrorReportsRoute = () =>
  import('./pages/DevTools/ErrorReports/ErrorReports');

export const loadErrorScreenPreviewRoute = () =>
  import('./pages/DevTools/ErrorScreenPreview/ErrorScreenPreview');

export const loadFinanceReadinessAuditRoute = () =>
  import('./pages/DevTools/FinanceReadinessAudit/FinanceReadinessAudit');

export const loadFiscalReceiptsAuditRoute = () =>
  import('./pages/DevTools/FiscalReceiptsAudit/FiscalReceiptsAudit').then(
    (module) => ({ default: module.FiscalReceiptsAudit }),
  );

export const loadHeroUiPlaygroundRoute = () =>
  import('./pages/DevTools/HeroUiPlayground/HeroUiPlayground');

export const loadInventoryMigrationToolRoute = () =>
  import('./pages/DevTools/InventoryMigrationTool');

export const loadInvoiceV2RecoveryRoute = () =>
  import('./pages/DevTools/InvoiceV2Recovery/InvoiceV2Recovery');

export const loadProductFormV2TestBenchRoute = () =>
  import('./pages/DevTools/ProductFormV2Test/ProductFormV2TestBench');

export const loadProductPriceAuditRoute = () =>
  import('./pages/DevTools/CheckProductPriceAudit/CheckProductPriceAudit');

export const loadProductStudioRoute = () =>
  import('./pages/DevTools/ProductStudio/ProductStudio');

export const loadSwitchBusinessRoute = () => import('./pages/dev/SwitchBusiness');

export const loadSyncDiagnosticsRoute = () =>
  import('./pages/DevTools/SyncDiagnostics');

export const loadTestPlaygroundRoute = () =>
  import('./pages/DevTools/TestPlayground');
