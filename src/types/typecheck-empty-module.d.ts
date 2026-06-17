import type { ComponentType } from 'react';

declare const moduleValue: ComponentType<any>;
type LazyRouteModule = Promise<{ default: ComponentType<any> }>;
type LazyRouteLoader = () => LazyRouteModule;
type LazyNamedDeveloperModalLoader = () => Promise<{
  DeveloperModal: ComponentType<any>;
}>;

export default moduleValue;

export const developerShortcuts: any[];
export const loadAdvancedTableDocRoute: LazyRouteLoader;
export const loadAccountingPilotAuditRoute: LazyRouteLoader;
export const loadAiBusinessSeedingRoute: LazyRouteLoader;
export const loadBSeriesInvoicesRoute: LazyRouteLoader;
export const loadCashCountAuditRoute: LazyRouteLoader;
export const loadCustomHeroUiPlaygroundRoute: LazyRouteLoader;
export const loadDeveloperConsoleModal: LazyNamedDeveloperModalLoader;
export const loadElectronicTaxReceiptProviderConfigRoute: LazyRouteLoader;
export const loadErrorReportsRoute: LazyRouteLoader;
export const loadErrorScreenPreviewRoute: LazyRouteLoader;
export const loadFinanceReadinessAuditRoute: LazyRouteLoader;
export const loadFiscalReceiptsAuditRoute: LazyRouteLoader;
export const loadHeroUiPlaygroundRoute: LazyRouteLoader;
export const loadInventoryMigrationToolRoute: LazyRouteLoader;
export const loadInvoiceV2RecoveryRoute: LazyRouteLoader;
export const loadProductFormV2TestBenchRoute: LazyRouteLoader;
export const loadProductPriceAuditRoute: LazyRouteLoader;
export const loadProductStudioRoute: LazyRouteLoader;
export const loadSwitchBusinessRoute: LazyRouteLoader;
export const loadSyncDiagnosticsRoute: LazyRouteLoader;
export const loadTestPlaygroundRoute: LazyRouteLoader;
