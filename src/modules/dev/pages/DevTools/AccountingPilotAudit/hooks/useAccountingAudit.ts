import { useCallback, useState } from 'react';

import { fetchAccountingAuditState } from '../repositories/accountingPilotAudit.repository';
import type { AuditState, DomainAuditResult, DomainKey } from '../types';

const emptyResult = (domain: DomainKey): DomainAuditResult => ({
  domain,
  rows: [],
  error: null,
  loading: false,
});

const loadingResult = (domain: DomainKey): DomainAuditResult => ({
  ...emptyResult(domain),
  loading: true,
});

const initialState: AuditState = {
  invoices: emptyResult('invoices'),
  accountsReceivablePayments: emptyResult('accountsReceivablePayments'),
  purchases: emptyResult('purchases'),
  expenses: emptyResult('expenses'),
};

export const useAccountingAudit = () => {
  const [state, setState] = useState<AuditState>(initialState);

  const refresh = useCallback((businessId: string) => {
    if (!businessId) return;

    setState({
      invoices: loadingResult('invoices'),
      accountsReceivablePayments: loadingResult('accountsReceivablePayments'),
      purchases: loadingResult('purchases'),
      expenses: loadingResult('expenses'),
    });

    const run = async () => {
      setState(await fetchAccountingAuditState(businessId));
    };

    run();
  }, []);

  return { state, refresh };
};
