import { toNumber } from '@/utils/number/toNumber';
import type { CreditLimitConfig } from './types';

export interface CreditLimitStatus {
  activeAccountsReceivableCount: number;
  isWithinCreditLimit: boolean;
  isWithinInvoiceCount: boolean;
  creditLimitValue: number;
}

interface CreditLimitStatusArgs {
  creditLimit?: CreditLimitConfig | null;
  activeAccountsReceivableCount?: number | null;
  change: number;
  currentBalance?: number | null;
}

export const resolveCreditLimitStatus = ({
  creditLimit,
  activeAccountsReceivableCount,
  change,
  currentBalance,
}: CreditLimitStatusArgs): CreditLimitStatus => {
  const normalizedActiveCount = toNumber(activeAccountsReceivableCount, 0);
  const invoiceLimitEnabled = Boolean(creditLimit?.invoice?.status);
  const maxInvoices = toNumber(creditLimit?.invoice?.value, 0);
  const isWithinInvoiceCount =
    !invoiceLimitEnabled || normalizedActiveCount < maxInvoices;

  const creditLimitEnabled = Boolean(creditLimit?.creditLimit?.status);
  const limitValue = toNumber(creditLimit?.creditLimit?.value, 0);
  const baseBalance = toNumber(
    currentBalance ?? creditLimit?.currentBalance,
    0,
  );
  const balanceDelta = change < 0 ? Math.abs(change) : 0;
  const nextBalance = baseBalance + balanceDelta;
  const isWithinCreditLimit =
    !creditLimitEnabled || nextBalance <= limitValue;

  return {
    activeAccountsReceivableCount: normalizedActiveCount,
    isWithinCreditLimit,
    isWithinInvoiceCount,
    creditLimitValue: creditLimitEnabled ? nextBalance : 0,
  };
};
