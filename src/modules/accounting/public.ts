export { AddBankAccountModal } from './components/banking/AddBankAccountModal';
export { BankPaymentPolicySection } from './components/banking/BankPaymentPolicySection';
export { useAccountingConfig } from './hooks/useAccountingConfig';
export { useAccountingPostingProfiles } from './hooks/useAccountingPostingProfiles';
export {
  useActiveBankAccounts,
  useActiveBankAccountsState,
} from './hooks/useActiveBankAccounts';
export { useCashAccounts } from './hooks/useCashAccounts';
export { useChartOfAccounts } from './hooks/useChartOfAccounts';
export { useOpenAccountingEntry } from './hooks/useOpenAccountingEntry';
export type { BankAccountOption } from './hooks/useActiveBankAccounts';
export type {
  AccountingManualRatesByCurrency,
  AccountingSettingsConfig,
  AccountingSettingsHistoryEntry,
  SupportedDocumentCurrency,
} from './utils/accountingConfig';
export type {
  ExchangeRateReferenceSnapshot,
} from './utils/exchangeRateReference';

export const loadAccountingWorkspaceRoute = () =>
  import('./pages/AccountingWorkspace/AccountingWorkspace');
