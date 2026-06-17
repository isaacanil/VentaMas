import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

import { useOpenAccountPayment } from '../../hooks/useOpenAccountPayment';
import { AccountPaymentAction } from './AccountPaymentAction';
import type { AccountPaymentClientSummary } from './types';

type AccountPaymentControlProps = {
  installments: number;
  balance: number;
  isActive?: boolean;
  account: AccountsReceivableDoc;
  client?: AccountPaymentClientSummary | null;
  paidInstallmentsCount?: number;
};

export function AccountPaymentControl({
  installments,
  balance,
  isActive,
  account,
  client,
  paidInstallmentsCount,
}: AccountPaymentControlProps) {
  const { openAccountPayment } = useOpenAccountPayment(client);
  const resolvedPaidInstallmentsCount =
    paidInstallmentsCount ?? account?.paidInstallments?.length ?? 0;

  const handlePay = () => {
    openAccountPayment({
      account,
      balance,
    });
  };

  return (
    <AccountPaymentAction
      installments={installments}
      paidInstallmentsCount={resolvedPaidInstallmentsCount}
      isActive={isActive}
      balance={balance}
      onPay={handlePay}
    />
  );
}
