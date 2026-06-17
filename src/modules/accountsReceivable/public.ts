export {
  ACCOUNT_RECEIVABLE_DETAIL_QUERY_PARAM,
  buildAccountReceivableListUrl,
} from './utils/accountReceivableNavigation';
export { useCreditLimitCheck } from './hooks/useCheckAccountReceivable';
export { useCreditLimitRealtime } from './hooks/useCreditLimitRealtime';
export { useDueDatesReceivable } from './hooks/useDueDatesReceivable';

export const loadAccountReceivableAuditRoute = () =>
  import(
    './pages/AccountReceivable/pages/AccountReceivableAudit/AccountReceivableAudit'
  );

export const loadAccountReceivableInfoRoute = () =>
  import(
    './pages/AccountReceivable/pages/AccountReceivableInfo/AccountReceivableInfo'
  );

export const loadAccountReceivableListRoute = () =>
  import(
    './pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList'
  ).then((module) => ({ default: module.AccountReceivableList }));

export const loadAccountReceivableSummaryModal = () =>
  import('./components/ARInfoModal/ARSummaryModal');

export const loadAccountsReceivablePaymentForm = () =>
  import('./components/PaymentForm/PaymentForm').then((module) => ({
    default: module.PaymentForm,
  }));
