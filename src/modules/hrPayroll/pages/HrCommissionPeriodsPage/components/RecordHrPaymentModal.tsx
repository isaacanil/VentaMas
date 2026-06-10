import type { FormEvent, Key } from 'react';
import { useState } from 'react';

import {
  VmButton,
  VmForm,
  VmInput,
  VmListBox,
  VmModal,
  VmSelect,
} from '@/components/heroui';
import {
  HrCellStack as CellStack,
  HrMutedText as MutedText,
  HrPrimaryText as PrimaryText,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import { fromHrDateKey, toHrDateKey } from '@/modules/hrPayroll/utils/hrDateRange';
import {
  formatHrMoney as formatMoney,
  formatHrPeriodDate,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionPeriodRecord,
  HrPaymentMethod,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

import {
  PAYMENT_METHOD_OPTIONS,
  normalizePaymentMethod,
} from './RecordHrPaymentModal.helpers';
import {
  Field,
  FieldGrid,
  FieldHint,
  FieldLabel,
  FormError,
  ModalActions,
  PaymentFormula,
  PaymentSummary,
  PaymentSummaryGrid,
  PaymentSummaryItem,
  PaymentSummaryLabel,
  PaymentSummaryValue,
  PaymentWarning,
} from './RecordHrPaymentModal.styles';

export interface PaymentFormValues {
  bankAccountId?: string;
  cashAccountId?: string;
  cashCountId?: string;
  checkNumber?: string;
  paymentDate: Date;
  paymentMethod: HrPaymentMethod;
  reference?: string;
  transferReference?: string;
}

interface RecordHrPaymentModalProps {
  actionKey: string | null;
  line: HrPayrollEmployeeLineRecord;
  onCancel: () => void;
  onFinish: (values: PaymentFormValues) => void | Promise<void>;
  period: HrCommissionPeriodRecord | null;
}

const getLineDeductionAmount = (line: HrPayrollEmployeeLineRecord): number =>
  line.deductionsAmount ||
  Math.max(
    0,
    (line.grossAmount || line.commissionAmount || line.netAmount) -
      line.netAmount,
  );

const getPeriodRangeLabel = (
  period: HrCommissionPeriodRecord | null,
): string =>
  period
    ? `${formatHrPeriodDate(period, 'start')} - ${formatHrPeriodDate(
        period,
        'end',
      )}`
    : 'Rango no disponible';

const getPeriodName = (
  period: HrCommissionPeriodRecord | null,
  line: HrPayrollEmployeeLineRecord,
): string =>
  (period?.label || period?.periodKey || line.periodId || 'Corte').replace(
    /\s+\d{4}-\d{2}-\d{2}\s+-\s+\d{4}-\d{2}-\d{2}$/,
    '',
  );

const validatePaymentDraft = (draft: PaymentFormValues): string | null => {
  if (draft.paymentMethod === 'cash') {
    if (!draft.cashAccountId?.trim() || !draft.cashCountId?.trim()) {
      return 'Indica la caja y el cuadre operativo para registrar este pago en efectivo.';
    }
    return null;
  }

  if (
    (draft.paymentMethod === 'bank_transfer' ||
      draft.paymentMethod === 'transfer' ||
      draft.paymentMethod === 'check') &&
    !draft.bankAccountId?.trim()
  ) {
    return 'Indica la cuenta bancaria operativa antes de confirmar el pago.';
  }

  if (draft.paymentMethod === 'check' && !draft.checkNumber?.trim()) {
    return 'Indica el número de cheque antes de confirmar el pago.';
  }

  return null;
};

const getPaymentFormula = ({
  commissionAmount,
  currency,
  deductionAmount,
  manualAdjustmentAmount,
  netAmount,
  retroactiveAdjustmentAmount,
}: {
  commissionAmount: number;
  currency: string;
  deductionAmount: number;
  manualAdjustmentAmount: number;
  netAmount: number;
  retroactiveAdjustmentAmount: number;
}): string => {
  const parts = [`Comisión normal ${formatMoney(commissionAmount, currency)}`];

  if (retroactiveAdjustmentAmount > 0) {
    parts.push(
      `retroactiva ${formatMoney(retroactiveAdjustmentAmount, currency)}`,
    );
  }

  if (manualAdjustmentAmount > 0) {
    parts.push(`ajuste manual ${formatMoney(manualAdjustmentAmount, currency)}`);
  }

  if (deductionAmount > 0) {
    parts.push(`deducciones -${formatMoney(deductionAmount, currency)}`);
  }

  return `${parts.join(' + ')} = ${formatMoney(netAmount, currency)}`;
};

export function RecordHrPaymentModal({
  actionKey,
  line,
  onCancel,
  onFinish,
  period,
}: RecordHrPaymentModalProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [draft, setDraft] = useState<PaymentFormValues>(() => ({
    paymentDate: new Date(),
    paymentMethod: normalizePaymentMethod(line.paymentMethod),
    reference: '',
    transferReference: '',
    checkNumber: '',
    bankAccountId: '',
    cashAccountId: '',
    cashCountId: '',
  }));
  const saving = actionKey === `pay:${line.id}`;

  const updateField = <K extends keyof PaymentFormValues>(
    field: K,
    value: PaymentFormValues[K],
  ) => {
    setFormError(null);
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleMethodChange = (key: Key | null) => {
    if (!key) return;
    updateField('paymentMethod', String(key) as HrPaymentMethod);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validatePaymentDraft(draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    void onFinish(draft);
  };

  const periodLabel = getPeriodName(period, line);
  const retroactiveAdjustmentAmount = line.retroactiveAdjustmentAmount ?? 0;
  const manualAdjustmentAmount = line.manualAdjustmentAmount ?? 0;
  const deductionAmount = getLineDeductionAmount(line);
  const summaryItems = [
    {
      label: 'Comisión normal',
      value: line.commissionAmount,
      visible: true,
    },
    {
      label: 'Retroactiva',
      value: retroactiveAdjustmentAmount,
      visible: retroactiveAdjustmentAmount > 0,
    },
    {
      label: 'Ajuste manual',
      value: manualAdjustmentAmount,
      visible: manualAdjustmentAmount > 0,
    },
    {
      label: 'Deducciones',
      value: deductionAmount,
      visible: deductionAmount > 0,
    },
    {
      label: 'Total a pagar',
      value: line.netAmount,
      visible: true,
    },
  ];

  return (
    <VmModal
      title="Registrar pago"
      ariaLabel="Registrar pago de nómina"
      isOpen
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      size="md"
      footer={
        <ModalActions>
          <VmButton variant="secondary" isDisabled={saving} onPress={onCancel}>
            Cancelar
          </VmButton>
          <VmButton
            type="submit"
            form="hr-payment-form"
            variant="primary"
            isDisabled={saving}
          >
            {saving
              ? 'Registrando...'
              : `Registrar pago de ${formatMoney(line.netAmount, line.currency)}`}
          </VmButton>
        </ModalActions>
      }
    >
      <PaymentSummary>
        <CellStack>
          <PrimaryText>
            {line.employeeNameSnapshot || line.employeeCode || line.employeeId}
          </PrimaryText>
          <MutedText>
            {periodLabel} · {getPeriodRangeLabel(period)}
          </MutedText>
        </CellStack>
        <PaymentFormula>
          <strong>Cómo se calculó:</strong>{' '}
          {getPaymentFormula({
            commissionAmount: line.commissionAmount,
            currency: line.currency,
            deductionAmount,
            manualAdjustmentAmount,
            netAmount: line.netAmount,
            retroactiveAdjustmentAmount,
          })}
        </PaymentFormula>
        <PaymentSummaryGrid>
          {summaryItems
            .filter((item) => item.visible)
            .map((item) => (
              <PaymentSummaryItem key={item.label}>
                <PaymentSummaryLabel>{item.label}</PaymentSummaryLabel>
                <PaymentSummaryValue>
                  {formatMoney(item.value, line.currency)}
                </PaymentSummaryValue>
              </PaymentSummaryItem>
            ))}
        </PaymentSummaryGrid>
        <PaymentWarning>
          Al registrar este pago, las comisiones normales y retroactivas
          enlazadas a esta línea quedarán marcadas como pagadas.
        </PaymentWarning>
      </PaymentSummary>

      <VmForm id="hr-payment-form" onSubmit={handleSubmit}>
        <FieldGrid>
          {formError ? <FormError role="alert">{formError}</FormError> : null}
          <Field>
            <FieldLabel>Fecha de pago</FieldLabel>
            <VmInput
              aria-label="Fecha de pago"
              type="date"
              value={toHrDateKey(draft.paymentDate)}
              disabled={saving}
              onChange={(event) =>
                updateField(
                  'paymentDate',
                  fromHrDateKey(event.target.value, 'start'),
                )
              }
            />
          </Field>

          <Field>
            <FieldLabel>Método</FieldLabel>
            <VmSelect
              aria-label="Método de pago"
              selectedKey={draft.paymentMethod}
              isDisabled={saving}
              onSelectionChange={handleMethodChange}
            >
              <VmSelect.Trigger>
                <VmSelect.Value />
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <VmListBox aria-label="Métodos de pago">
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <VmListBox.Item
                      key={option.value}
                      id={option.value}
                      textValue={option.label}
                    >
                      {option.label}
                      <VmListBox.ItemIndicator />
                    </VmListBox.Item>
                  ))}
                </VmListBox>
              </VmSelect.Popover>
            </VmSelect>
          </Field>

          {/* TODO Fase posterior: reemplazar estas referencias por selectores
          cuando existan catálogos operativos. */}
          {draft.paymentMethod === 'cash' ? (
            <>
              <Field>
                <FieldLabel>Caja operativa</FieldLabel>
                <VmInput
                  aria-label="Caja operativa"
                  value={draft.cashAccountId ?? ''}
                  disabled={saving}
                  placeholder="Ej. Caja principal · sucursal central"
                  onChange={(event) =>
                    updateField('cashAccountId', event.target.value)
                  }
                />
                <FieldHint>
                  Usa el nombre visible de la caja registrada en Tesorería.
                </FieldHint>
              </Field>
              <Field>
                <FieldLabel>Cuadre de caja</FieldLabel>
                <VmInput
                  aria-label="Cuadre de caja"
                  value={draft.cashCountId ?? ''}
                  disabled={saving}
                  placeholder="Ej. Cuadre caja central · 10/06/2026"
                  onChange={(event) =>
                    updateField('cashCountId', event.target.value)
                  }
                />
                <FieldHint>
                  Indica el cuadre abierto que soporta la salida de efectivo.
                </FieldHint>
              </Field>
            </>
          ) : null}

          {draft.paymentMethod !== 'cash' ? (
            <Field>
              <FieldLabel>Cuenta bancaria operativa</FieldLabel>
              <VmInput
                aria-label="Cuenta bancaria operativa"
                value={draft.bankAccountId ?? ''}
                disabled={saving}
                placeholder="Ej. Banco Popular · Operativa 1234"
                onChange={(event) =>
                  updateField('bankAccountId', event.target.value)
                }
              />
              <FieldHint>
                Usa el nombre visible de la cuenta bancaria; evita escribir
                códigos técnicos si Finanzas no los reconoce.
              </FieldHint>
            </Field>
          ) : null}

          {draft.paymentMethod === 'check' ? (
            <Field>
              <FieldLabel>Cheque</FieldLabel>
              <VmInput
                aria-label="Cheque"
                value={draft.checkNumber ?? ''}
                disabled={saving}
              placeholder="Número de cheque"
                onChange={(event) =>
                  updateField('checkNumber', event.target.value)
                }
              />
            </Field>
          ) : null}

          <Field>
            <FieldLabel>Referencia bancaria</FieldLabel>
            <VmInput
              aria-label="Referencia bancaria"
              value={draft.transferReference ?? ''}
              disabled={saving}
              placeholder="Ej. confirmación bancaria o número de transacción"
              onChange={(event) =>
                updateField('transferReference', event.target.value)
              }
            />
          </Field>

          <Field>
            <FieldLabel>Referencia interna</FieldLabel>
            <VmInput
              aria-label="Referencia interna"
              value={draft.reference ?? ''}
              disabled={saving}
              placeholder="Ej. pago comisiones primera quincena junio"
              onChange={(event) => updateField('reference', event.target.value)}
            />
          </Field>
        </FieldGrid>
      </VmForm>
    </VmModal>
  );
}
