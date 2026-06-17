import { useEffect, useState } from 'react';

import {
  listenActiveBankAccountOptions,
  type ActiveBankAccountOption,
} from '@/firebase/accounting/bankAccounts.repository';

export type BankAccountOption = ActiveBankAccountOption;

interface ActiveBankAccountsState {
  businessId: string | null;
  options: BankAccountOption[];
  status: 'idle' | 'loaded' | 'error';
}

export const useActiveBankAccountsState = (
  businessId: string | null | undefined,
  isOpen: boolean,
): {
  error: boolean;
  loading: boolean;
  options: BankAccountOption[];
} => {
  const [state, setState] = useState<ActiveBankAccountsState>({
    businessId: null,
    options: [],
    status: 'idle',
  });

  useEffect(() => {
    if (!businessId || !isOpen) return undefined;

    return listenActiveBankAccountOptions(
      businessId,
      (options) => {
        setState({
          businessId,
          options,
          status: 'loaded',
        });
      },
      () => {
        setState({
          businessId,
          options: [],
          status: 'error',
        });
      },
    );
  }, [businessId, isOpen]);

  const isCurrentSnapshot =
    Boolean(businessId && isOpen) && state.businessId === businessId;

  return {
    error: isCurrentSnapshot && state.status === 'error',
    loading: Boolean(businessId && isOpen && !isCurrentSnapshot),
    options: isCurrentSnapshot ? state.options : [],
  };
};

export const useActiveBankAccounts = (
  businessId: string | null | undefined,
  isOpen: boolean,
): BankAccountOption[] => {
  const { options } = useActiveBankAccountsState(businessId, isOpen);

  return options;
};
