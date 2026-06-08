import { VmAlertDialog, VmButton } from '@/components/heroui';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  LockOutlined,
} from '@/constants/icons/antd';
import type { HrCommissionPeriodRecord } from '@/types/hrPayroll';

import {
  PeriodActionGroup,
  PeriodActionStatus,
} from './PeriodActionButtons.styles';

type PeriodAction = 'close' | 'approve';

interface PeriodActionButtonsProps {
  actionKey: string | null;
  layout?: 'inline' | 'toolbar';
  onAction: (action: PeriodAction, period: HrCommissionPeriodRecord) => void;
  period: HrCommissionPeriodRecord;
}

export function PeriodActionButtons({
  actionKey,
  layout = 'inline',
  onAction,
  period,
}: PeriodActionButtonsProps) {
  const closeActionKey = `close:${period.id}`;
  const approveActionKey = `approve:${period.id}`;
  const isClosing = actionKey === closeActionKey;
  const isApproving = actionKey === approveActionKey;
  const periodName = period.label || period.periodKey || 'corte';

  if (period.status === 'paid') {
    return (
      <PeriodActionGroup
        aria-label={`Acciones del corte ${periodName}`}
        data-layout={layout}
        role="group"
      >
        <PeriodActionStatus $tone="success">
          <CheckCircleOutlined />
          Corte pagado
        </PeriodActionStatus>
      </PeriodActionGroup>
    );
  }

  if (period.status === 'partially_paid') {
    return (
      <PeriodActionGroup
        aria-label={`Acciones del corte ${periodName}`}
        data-layout={layout}
        role="group"
      >
        <PeriodActionStatus $tone="accent">
          <DollarOutlined />
          Pago parcial
        </PeriodActionStatus>
      </PeriodActionGroup>
    );
  }

  if (period.status === 'approved') {
    return (
      <PeriodActionGroup
        aria-label={`Acciones del corte ${periodName}`}
        data-layout={layout}
        role="group"
      >
        <PeriodActionStatus $tone="success">
          <DollarOutlined />
          Listo para pagos
        </PeriodActionStatus>
      </PeriodActionGroup>
    );
  }

  if (period.status === 'cancelled') {
    return (
      <PeriodActionGroup
        aria-label={`Acciones del corte ${periodName}`}
        data-layout={layout}
        role="group"
      >
        <PeriodActionStatus $tone="default">
          <ClockCircleOutlined />
          Cancelado
        </PeriodActionStatus>
      </PeriodActionGroup>
    );
  }

  return (
    <PeriodActionGroup
      aria-label={`Acciones del corte ${periodName}`}
      data-layout={layout}
      role="group"
    >
      {period.status === 'draft' ? (
        <VmButton
          variant="secondary"
          isDisabled={isClosing}
          onPress={() => onAction('close', period)}
        >
          <LockOutlined />
          {isClosing ? 'Cerrando...' : 'Cerrar para revision'}
        </VmButton>
      ) : null}

      {period.status === 'closed' ? (
        <VmAlertDialog>
          <VmButton variant="primary" isDisabled={isApproving}>
            <CheckCircleOutlined />
            {isApproving ? 'Aprobando...' : 'Aprobar corte'}
          </VmButton>
          <VmAlertDialog.Backdrop>
            <VmAlertDialog.Container>
              <VmAlertDialog.Dialog>
                <VmAlertDialog.Header>
                  <VmAlertDialog.Heading>Aprobar corte</VmAlertDialog.Heading>
                </VmAlertDialog.Header>
                <VmAlertDialog.Body>
                  Se marcara el corte como aprobado y se emitira el evento
                  contable.
                </VmAlertDialog.Body>
                <VmAlertDialog.Footer>
                  <VmButton slot="close" variant="secondary">
                    Cancelar
                  </VmButton>
                  <VmButton
                    slot="close"
                    variant="primary"
                    isDisabled={isApproving}
                    onPress={() => onAction('approve', period)}
                  >
                    {isApproving ? 'Aprobando...' : 'Aprobar corte'}
                  </VmButton>
                </VmAlertDialog.Footer>
              </VmAlertDialog.Dialog>
            </VmAlertDialog.Container>
          </VmAlertDialog.Backdrop>
        </VmAlertDialog>
      ) : null}
    </PeriodActionGroup>
  );
}
