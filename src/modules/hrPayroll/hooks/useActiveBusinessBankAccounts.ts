import {
  useActiveBankAccountsState,
  type BankAccountOption,
} from '@/modules/accounting/public';

export type HrBusinessBankAccountOption = BankAccountOption;

export const useActiveBusinessBankAccounts = ({
  businessId,
  enabled,
}: {
  businessId?: string | null;
  enabled: boolean;
}): {
  error: boolean;
  loading: boolean;
  options: HrBusinessBankAccountOption[];
} => {
  return useActiveBankAccountsState(businessId, enabled);
};
