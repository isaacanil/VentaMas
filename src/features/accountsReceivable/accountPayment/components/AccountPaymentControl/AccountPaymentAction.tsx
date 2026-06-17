import { faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { formatPrice } from '@/utils/format';

import {
  BalanceAmount,
  PaymentActions,
  PaymentButton,
  PaymentContainer,
  PaymentInfo,
  ProgressBar,
  ProgressFill,
} from './AccountPaymentAction.styles';

type AccountPaymentActionProps = {
  installments: number;
  paidInstallmentsCount: number;
  balance: number;
  isActive?: boolean;
  onPay: () => void;
};

export function AccountPaymentAction({
  installments,
  paidInstallmentsCount,
  balance,
  isActive,
  onPay,
}: AccountPaymentActionProps) {
  const progress =
    installments > 0 ? (paidInstallmentsCount / installments) * 100 : 0;

  return (
    <PaymentContainer>
      <PaymentInfo>
        <ProgressBar>
          <ProgressFill $percentage={progress} />
        </ProgressBar>
      </PaymentInfo>

      <PaymentActions>
        <BalanceAmount $isPaid={balance === 0}>
          {formatPrice(balance)}
        </BalanceAmount>
        <PaymentButton
          type="primary"
          disabled={!isActive}
          onClick={onPay}
          icon={<FontAwesomeIcon icon={faMoneyBillWave} />}
        >
          Pagar
        </PaymentButton>
      </PaymentActions>
    </PaymentContainer>
  );
}
