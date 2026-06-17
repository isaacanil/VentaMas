export { useAccountsPayablePayments } from './hooks/useAccountsPayablePayments';
export { useListenVendorBills } from './hooks/useVendorBills';

export const loadAccountsPayableListRoute = () =>
  import('./pages/AccountsPayable/AccountsPayable').then((module) => ({
    default: module.AccountsPayable,
  }));
