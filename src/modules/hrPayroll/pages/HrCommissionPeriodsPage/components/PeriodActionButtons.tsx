import { VmAlertDialog, VmButton } from '@/components/heroui';
import { CheckCircleOutlined, LockOutlined } from '@/constants/icons/antd';
import type { HrCommissionPeriodRecord } from '@/types/hrPayroll';

import { PeriodActionGroup } from './PeriodActionButtons.styles';

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

  return (
    <PeriodActionGroup
      aria-label={`Acciones del corte ${period.label || period.periodKey}`}
      data-layout={layout}
      role="group"
    >
      <VmButton
        variant="secondary"
        isDisabled={period.status !== 'draft' || isClosing}
        onPress={() => onAction('close', period)}
      >
        <LockOutlined />
        {isClosing ? 'Generando...' : 'Generar corte'}
      </VmButton>

      <VmAlertDialog>
        <VmButton
          variant="primary"
          isDisabled={period.status !== 'closed' || isApproving}
        >
          <CheckCircleOutlined />
          {isApproving ? 'Aprobando...' : 'Aprobar'}
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
                  onPress={() => onAction('approve', period)}
                >
                  Aprobar
                </VmButton>
              </VmAlertDialog.Footer>
            </VmAlertDialog.Dialog>
          </VmAlertDialog.Container>
        </VmAlertDialog.Backdrop>
      </VmAlertDialog>
    </PeriodActionGroup>
  );
}
