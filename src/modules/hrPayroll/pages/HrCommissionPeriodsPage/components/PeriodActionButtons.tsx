import { VmAlertDialog, VmButton, VmDropdown } from '@/components/heroui';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownOutlined,
  DollarOutlined,
  LockOutlined,
  RollbackOutlined,
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
  onRequestRevertApproval?: (period: HrCommissionPeriodRecord) => void;
  period: HrCommissionPeriodRecord;
}

export function PeriodActionButtons({
  actionKey,
  layout = 'inline',
  onAction,
  onRequestRevertApproval,
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
    const canRequestRevert =
      typeof onRequestRevertApproval === 'function' &&
      (period.paidAmount ?? 0) <= 0 &&
      (period.paidLinesCount ?? 0) <= 0;

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
        {canRequestRevert ? (
          <VmDropdown>
            <VmDropdown.Button
              variant="secondary"
              isDisabled={actionKey === `revert_approval:${period.id}`}
            >
              Más acciones
              <DownOutlined />
            </VmDropdown.Button>
            <VmDropdown.Popover placement="bottom end">
              <VmDropdown.Menu
                aria-label={`Más acciones del corte ${periodName}`}
                onAction={(key) => {
                  if (key === 'revert-approval') {
                    onRequestRevertApproval(period);
                  }
                }}
              >
                <VmDropdown.Item
                  id="revert-approval"
                  textValue="Revertir aprobación"
                >
                  <RollbackOutlined />
                  Revertir aprobación
                </VmDropdown.Item>
              </VmDropdown.Menu>
            </VmDropdown.Popover>
          </VmDropdown>
        ) : null}
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
          {isClosing ? 'Cerrando...' : 'Cerrar para revisión'}
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
                  Se marcará el corte como aprobado y se emitirá el evento
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
