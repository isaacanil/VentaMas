export { FilterBar } from './pages/OrderAndPurchase/shared/components/TransactionFilterBar/FilterBar';
export {
  RegisterSupplierPaymentModal,
  SupplierPaymentHistoryModal,
} from './components/supplierPayments';
export type {
  DataConfigMap,
  FilterConfigState,
  FilterOption,
  FilterState,
} from './pages/OrderAndPurchase/shared/filterBarTypes';

export const loadOrdersRoute = () =>
  import('./pages/OrderAndPurchase/Order/Orders').then((module) => ({
    default: module.Orders,
  }));

export const loadOrderManagementRoute = () =>
  import('./pages/OrderAndPurchase/OrderManagement/OrderManagement');

export const loadPurchasesRoute = () =>
  import('./pages/OrderAndPurchase/Compra/Purchases').then((module) => ({
    default: module.Purchases,
  }));

export const loadPurchaseManagementRoute = () =>
  import('./pages/OrderAndPurchase/PurchaseManagement/PurchaseManagement');

export const loadPurchasesAnalyticsRoute = () =>
  import('./pages/OrderAndPurchase/Compra/PurchasesAnalyticsPage').then(
    (module) => ({
      default: module.PurchasesAnalyticsPage,
    }),
  );

export const loadBackOrdersRoute = () =>
  import('./pages/OrderAndPurchase/BackOrders/BackOrders');

export const loadEvidenceUploadDrawer = () =>
  import('./pages/OrderAndPurchase/PurchaseManagement/components/EvidenceUploadDrawer/EvidenceUploadDrawer').then(
    (module) => ({ default: module.default }),
  );
