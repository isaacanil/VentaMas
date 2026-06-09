import type { FormEvent } from 'react';
import { useState } from 'react';

import { VmButton, VmForm, VmModal, VmTextArea } from '@/components/heroui';
import { formatHrMoney as formatMoney } from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type { HrCommissionPeriodRecord } from '@/types/hrPayroll';

import {
  Field,
  FieldHint,
  FieldLabel,
  ModalActions,
  ReversalSummary,
  SummaryText,
  SummaryTitle,
} from './RevertHrCommissionApprovalModal.styles';

export interface RevertHrCommissionApprovalValues {
  reason: string;
}

interface RevertHrCommissionApprovalModalProps {
  actionKey: string | null;
  onCancel: () => void;
  onFinish: (
    values: RevertHrCommissionApprovalValues,
  ) => void | Promise<void>;
  period: HrCommissionPeriodRecord;
}

export function RevertHrCommissionApprovalModal({
  actionKey,
  onCancel,
  onFinish,
  period,
}: RevertHrCommissionApprovalModalProps) {
  const [reason, setReason] = useState('');
  const saving = actionKey === `revert_approval:${period.id}`;
  const periodName = period.label || period.periodKey || 'Corte aprobado';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;

    void onFinish({ reason: reason.trim() });
  };

  return (
    <VmModal
      title="Revertir aprobación"
      ariaLabel="Revertir aprobación del corte"
      isOpen
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      size="sm"
      footer={
        <ModalActions>
          <VmButton variant="secondary" isDisabled={saving} onPress={onCancel}>
            Cancelar
          </VmButton>
          <VmButton
            type="submit"
            form="hr-commission-revert-approval-form"
            variant="primary"
            isDisabled={saving}
          >
            {saving ? 'Revirtiendo...' : 'Revertir aprobación'}
          </VmButton>
        </ModalActions>
      }
    >
      <ReversalSummary>
        <SummaryTitle>{periodName}</SummaryTitle>
        <SummaryText>
          Volverá a cerrado para revisión. No se permite si ya tiene pagos o
          asiento contable proyectado.
        </SummaryText>
        <SummaryText>
          Total del corte:{' '}
          {formatMoney(
            period.netAmount ??
              period.totalPayableAmount ??
              period.totalCommissionAmount,
            period.currency,
          )}
        </SummaryText>
      </ReversalSummary>

      <VmForm id="hr-commission-revert-approval-form" onSubmit={handleSubmit}>
        <Field>
          <FieldLabel>Motivo de la reversión</FieldLabel>
          <VmTextArea
            aria-describedby="hr-commission-revert-approval-hint"
            aria-label="Motivo de la reversión"
            disabled={saving}
            maxLength={500}
            minLength={6}
            name="reason"
            required
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <FieldHint id="hr-commission-revert-approval-hint">
            Queda registrado para auditoría junto al usuario que hizo la
            reversión.
          </FieldHint>
        </Field>
      </VmForm>
    </VmModal>
  );
}
