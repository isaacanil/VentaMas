import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal } from 'antd';

import type { SubscriptionPlanOption } from '../subscription.types';
import { formatMoney } from '../subscription.utils';
import {
  ModalBody,
  ModalTitle,
  ModalDesc,
  PaymentInfo,
  PaymentIconWrapper,
  PaymentInfoText,
  PaymentMethod,
  PaymentCard,
  ModalActions,
} from './SubscriptionPlansCard.styles';

interface PlanChangeConfirmModalProps {
  open: boolean;
  selectedPlan: SubscriptionPlanOption | null;
  providerLabel: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const PlanChangeConfirmModal = ({
  open,
  selectedPlan,
  providerLabel,
  loading,
  onCancel,
  onConfirm,
}: PlanChangeConfirmModalProps) => (
  <Modal
    open={open}
    onCancel={onCancel}
    footer={null}
    closable={!loading}
    width={440}
    centered
  >
    <ModalBody>
      <ModalTitle>Confirmar cambio de plan</ModalTitle>
      <ModalDesc>
        Vas a cambiar al plan <strong>{selectedPlan?.displayName}</strong> por{' '}
        <strong>
          {selectedPlan
            ? formatMoney(selectedPlan.priceMonthly, selectedPlan.currency)
            : 'No definido'}
          /mes
        </strong>
        .
      </ModalDesc>

      <PaymentInfo>
        <PaymentIconWrapper>
          <FontAwesomeIcon icon={faCreditCard} />
        </PaymentIconWrapper>
        <PaymentInfoText>
          <PaymentMethod>Se redirigirá a {providerLabel}</PaymentMethod>
          <PaymentCard>
            El cambio se confirma desde el checkout seguro.
          </PaymentCard>
        </PaymentInfoText>
      </PaymentInfo>

      <ModalActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="primary" loading={loading} onClick={onConfirm}>
          Confirmar cambio
        </Button>
      </ModalActions>
    </ModalBody>
  </Modal>
);
