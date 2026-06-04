import type { FormEvent } from 'react';
import { useState } from 'react';

import {
  VmButton,
  VmForm,
  VmInput,
  VmModal,
  VmTextArea,
} from '@/components/heroui';
import { formatHrMoney as formatMoney } from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type { HrPayrollEmployeeLineRecord } from '@/types/hrPayroll';

import {
  AdjustmentSummary,
  Field,
  FieldGrid,
  FieldHint,
  FieldLabel,
  ModalActions,
  SummaryLabel,
  SummaryMetric,
  SummaryValue,
} from './EditHrPayableAmountModal.styles';

export interface PayableAmountFormValues {
  comment: string;
  totalToPay: number;
}

interface EditHrPayableAmountModalProps {
  actionKey: string | null;
  line: HrPayrollEmployeeLineRecord;
  onCancel: () => void;
  onFinish: (values: PayableAmountFormValues) => void | Promise<void>;
}

const getCalculatedPayableAmount = (
  line: HrPayrollEmployeeLineRecord,
): number => line.netAmount + (line.manualAdjustmentAmount ?? 0);

const getCurrentPayableAmount = (
  line: HrPayrollEmployeeLineRecord,
  fallbackAmount: number,
): number =>
  Number.isFinite(line.netAmount) ? line.netAmount : fallbackAmount;

const toAmountInputValue = (amount: number): string =>
  Number.isFinite(amount) ? amount.toFixed(2) : '';

export function EditHrPayableAmountModal({
  actionKey,
  line,
  onCancel,
  onFinish,
}: EditHrPayableAmountModalProps) {
  const calculatedAmount = getCalculatedPayableAmount(line);
  const currentPayableAmount = getCurrentPayableAmount(line, calculatedAmount);
  const [draft, setDraft] = useState({
    comment: line.manualAdjustmentComment ?? '',
    totalToPay: toAmountInputValue(currentPayableAmount),
  });
  const saving = actionKey === `adjust:${line.id}`;
  const parsedTotal = Number(draft.totalToPay);
  const previewTotal = Number.isFinite(parsedTotal)
    ? parsedTotal
    : currentPayableAmount;
  const adjustmentAmount = Math.max(0, calculatedAmount - previewTotal);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;

    void onFinish({
      comment: draft.comment.trim(),
      totalToPay: Number(draft.totalToPay),
    });
  };

  return (
    <VmModal
      title="Editar total a pagar"
      ariaLabel="Editar total a pagar del colaborador"
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
            form="hr-payable-adjustment-form"
            variant="primary"
            isDisabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </VmButton>
        </ModalActions>
      }
    >
      <AdjustmentSummary>
        <SummaryMetric>
          <SummaryLabel>Calculado</SummaryLabel>
          <SummaryValue>
            {formatMoney(calculatedAmount, line.currency)}
          </SummaryValue>
        </SummaryMetric>
        <SummaryMetric>
          <SummaryLabel>Ajuste</SummaryLabel>
          <SummaryValue>
            -{formatMoney(adjustmentAmount, line.currency)}
          </SummaryValue>
        </SummaryMetric>
        <SummaryMetric>
          <SummaryLabel>A pagar</SummaryLabel>
          <SummaryValue>
            {formatMoney(previewTotal, line.currency)}
          </SummaryValue>
        </SummaryMetric>
      </AdjustmentSummary>

      <VmForm id="hr-payable-adjustment-form" onSubmit={handleSubmit}>
        <FieldGrid>
          <Field>
            <FieldLabel>Total a pagar</FieldLabel>
            <VmInput
              aria-describedby="hr-payable-amount-hint"
              aria-label="Total a pagar"
              disabled={saving}
              inputMode="decimal"
              max={calculatedAmount}
              min={0}
              name="totalToPay"
              required
              step="0.01"
              type="number"
              value={draft.totalToPay}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  totalToPay: event.target.value,
                }))
              }
            />
            <FieldHint id="hr-payable-amount-hint">
              No puede superar el total calculado antes de ajustes manuales.
            </FieldHint>
          </Field>

          <Field>
            <FieldLabel>Comentario de la modificacion</FieldLabel>
            <VmTextArea
              aria-describedby="hr-payable-comment-hint"
              aria-label="Comentario de la modificacion"
              disabled={saving}
              minLength={6}
              name="comment"
              required
              rows={3}
              value={draft.comment}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  comment: event.target.value,
                }))
              }
            />
            <FieldHint id="hr-payable-comment-hint">
              Este comentario queda guardado en el historial de ajustes.
            </FieldHint>
          </Field>
        </FieldGrid>
      </VmForm>
    </VmModal>
  );
}
