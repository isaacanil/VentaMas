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
import { formatHrMoney as formatMoney } from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
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
  FieldLabel,
  ModalActions,
  PaymentSummary,
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
}

export function RecordHrPaymentModal({
  actionKey,
  line,
  onCancel,
  onFinish,
}: RecordHrPaymentModalProps) {
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
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleMethodChange = (key: Key | null) => {
    if (!key) return;
    updateField('paymentMethod', String(key) as HrPaymentMethod);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onFinish(draft);
  };

  return (
    <VmModal
      title="Registrar pago"
      ariaLabel="Registrar pago de nomina"
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
            form="hr-payment-form"
            variant="primary"
            isDisabled={saving}
          >
            {saving ? 'Registrando...' : 'Registrar'}
          </VmButton>
        </ModalActions>
      }
    >
      <PaymentSummary>
        <CellStack>
          <PrimaryText>
            {line.employeeNameSnapshot || line.employeeCode || line.employeeId}
          </PrimaryText>
          <MutedText>{formatMoney(line.netAmount, line.currency)}</MutedText>
        </CellStack>
      </PaymentSummary>

      <VmForm id="hr-payment-form" onSubmit={handleSubmit}>
        <FieldGrid>
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
            <FieldLabel>Metodo</FieldLabel>
            <VmSelect
              aria-label="Metodo de pago"
              selectedKey={draft.paymentMethod}
              isDisabled={saving}
              onSelectionChange={handleMethodChange}
            >
              <VmSelect.Trigger>
                <VmSelect.Value />
                <VmSelect.Indicator />
              </VmSelect.Trigger>
              <VmSelect.Popover>
                <VmListBox aria-label="Metodos de pago">
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

          {draft.paymentMethod === 'cash' ? (
            <>
              <Field>
                <FieldLabel>Caja</FieldLabel>
                <VmInput
                  aria-label="Caja"
                  value={draft.cashAccountId ?? ''}
                  disabled={saving}
                  placeholder="ID de caja"
                  onChange={(event) =>
                    updateField('cashAccountId', event.target.value)
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Cuadre</FieldLabel>
                <VmInput
                  aria-label="Cuadre"
                  value={draft.cashCountId ?? ''}
                  disabled={saving}
                  placeholder="ID de cuadre"
                  onChange={(event) =>
                    updateField('cashCountId', event.target.value)
                  }
                />
              </Field>
            </>
          ) : null}

          {draft.paymentMethod !== 'cash' ? (
            <Field>
              <FieldLabel>Cuenta bancaria</FieldLabel>
              <VmInput
                aria-label="Cuenta bancaria"
                value={draft.bankAccountId ?? ''}
                disabled={saving}
                placeholder="ID de cuenta"
                onChange={(event) =>
                  updateField('bankAccountId', event.target.value)
                }
              />
            </Field>
          ) : null}

          {draft.paymentMethod === 'check' ? (
            <Field>
              <FieldLabel>Cheque</FieldLabel>
              <VmInput
                aria-label="Cheque"
                value={draft.checkNumber ?? ''}
                disabled={saving}
                placeholder="Numero de cheque"
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
              placeholder="Referencia"
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
              placeholder="Referencia"
              onChange={(event) => updateField('reference', event.target.value)}
            />
          </Field>
        </FieldGrid>
      </VmForm>
    </VmModal>
  );
}
