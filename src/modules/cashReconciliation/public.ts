export { useOpenCashRegisters } from './hooks/useOpenCashRegisters';
export type { CashRegisterOption } from './hooks/useOpenCashRegisters';

export const loadCashReconciliationListRoute = () =>
  import('./pages/CashReconciliation/CashReconciliation').then((module) => ({
    default: module.CashReconciliation,
  }));

export const loadCashReconciliationClosureRoute = () =>
  import('./pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure').then(
    (module) => ({
      default: module.CashRegisterClosure,
    }),
  );

export const loadCashReconciliationOpeningRoute = () =>
  import('./pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening').then(
    (module) => ({
      default: module.CashRegisterOpening,
    }),
  );

export const loadCashReconciliationInvoiceOverviewRoute = () =>
  import('./pages/CashReconciliation/page/CashupInvoicesOverview/CashupInvoicesOverview').then(
    (module) => ({
      default: module.CashupInvoicesOverview,
    }),
  );
