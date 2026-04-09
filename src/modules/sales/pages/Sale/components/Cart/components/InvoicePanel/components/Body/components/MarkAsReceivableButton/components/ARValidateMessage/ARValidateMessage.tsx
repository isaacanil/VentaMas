import UnifiedARAlert from './components/GenericClientAlert';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';

type ARValidateMessageProps = {
  isGenericClient: boolean;
  clientId: string | null;
  invoiceId: string | null;
  isWithinCreditLimit: boolean;
  isWithinInvoiceCount: boolean;
  activeAccountsReceivableCount: number;
  creditLimit?: CreditLimitConfig | null;
  creditLimitValue?: number | null;
  hasAccountReceivablePermission: boolean;
  isChangeNegative: boolean;
  abilitiesLoading: boolean;
};

export const ARValidateMessage = ({
  isGenericClient,
  clientId,
  invoiceId,
  isWithinCreditLimit,
  isWithinInvoiceCount,
  activeAccountsReceivableCount,
  creditLimit,
  creditLimitValue,
  hasAccountReceivablePermission,
  isChangeNegative,
  abilitiesLoading,
}: ARValidateMessageProps) => {
  const isCreditLimitExceeded =
    creditLimit?.creditLimit?.status && !isWithinCreditLimit;
  const isInvoiceLimitExceeded =
    creditLimit?.invoice?.status && !isWithinInvoiceCount;

  return (
    <UnifiedARAlert
      isGenericClient={isGenericClient}
      isInvoiceLimitExceeded={isInvoiceLimitExceeded}
      isCreditLimitExceeded={isCreditLimitExceeded}
      activeAccountsReceivableCount={activeAccountsReceivableCount}
      creditLimit={creditLimit}
      clientId={clientId}
      invoiceId={invoiceId}
      hasAccountReceivablePermission={hasAccountReceivablePermission}
      isChangeNegative={isChangeNegative}
      abilitiesLoading={abilitiesLoading}
      creditLimitValue={creditLimitValue}
    />
  );
};
