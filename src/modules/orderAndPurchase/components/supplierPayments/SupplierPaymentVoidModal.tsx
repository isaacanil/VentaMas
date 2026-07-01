import { Button, Input, Typography } from 'antd';
import { useId, useState } from 'react';
import styled from 'styled-components';

import { ModalShell } from '@/components/common/Modal';
import type { AccountsPayablePayment } from '@/types/payments';

const { Text } = Typography;
const { TextArea } = Input;

const MIN_VOID_REASON_LENGTH = 5;
const MIN_VOID_EVIDENCE_LENGTH = 3;

const normalizeSupplierPaymentVoidReason = (value: string): string =>
  value.trim();

const normalizeSupplierPaymentVoidEvidence = (value: string): string =>
  value.trim();

const getSupplierPaymentVoidReasonError = (value: string): string | null =>
  normalizeSupplierPaymentVoidReason(value).length < MIN_VOID_REASON_LENGTH
    ? 'Indica un motivo de al menos 5 caracteres.'
    : null;

const getSupplierPaymentVoidEvidenceError = (value: string): string | null =>
  normalizeSupplierPaymentVoidEvidence(value).length < MIN_VOID_EVIDENCE_LENGTH
    ? 'Indica una evidencia o referencia.'
    : null;

interface SupplierPaymentVoidModalProps {
  open: boolean;
  payment: AccountsPayablePayment;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string, evidenceNote: string) => void | Promise<void>;
}

export const SupplierPaymentVoidModal = ({
  open,
  payment,
  submitting = false,
  onCancel,
  onConfirm,
}: SupplierPaymentVoidModalProps) => {
  const reasonInputId = useId();
  const reasonErrorId = useId();
  const evidenceInputId = useId();
  const evidenceErrorId = useId();
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);
  const [evidenceTouched, setEvidenceTouched] = useState(false);
  const normalizedReason = normalizeSupplierPaymentVoidReason(reason);
  const normalizedEvidence = normalizeSupplierPaymentVoidEvidence(evidence);
  const reasonError = reasonTouched
    ? getSupplierPaymentVoidReasonError(reason)
    : null;
  const evidenceError = evidenceTouched
    ? getSupplierPaymentVoidEvidenceError(evidence)
    : null;

  const handleConfirm = () => {
    setReasonTouched(true);
    setEvidenceTouched(true);
    if (
      getSupplierPaymentVoidReasonError(reason) ||
      getSupplierPaymentVoidEvidenceError(evidence)
    ) {
      return;
    }
    void onConfirm(normalizedReason, normalizedEvidence);
  };

  return (
    <ModalShell
      title="Anular pago"
      open={open}
      onCancel={onCancel}
      width={480}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>,
        <Button
          key="void"
          danger
          type="primary"
          onClick={handleConfirm}
          loading={submitting}
        >
          Anular pago
        </Button>,
      ]}
      destroyOnHidden
    >
      <VoidForm>
        <Text>
          Se anulará el recibo{' '}
          <strong>{payment.receiptNumber ?? payment.id}</strong>.
        </Text>
        <ReasonField>
          <label htmlFor={reasonInputId}>Motivo de anulación</label>
          <TextArea
            id={reasonInputId}
            aria-errormessage={reasonError ? reasonErrorId : undefined}
            aria-invalid={reasonError ? 'true' : 'false'}
            autoSize={{ minRows: 3, maxRows: 5 }}
            disabled={submitting}
            maxLength={240}
            onBlur={() => setReasonTouched(true)}
            onChange={(event) => {
              const nextReason = event.target.value;
              setReason(nextReason);
              if (
                reasonTouched &&
                getSupplierPaymentVoidReasonError(nextReason) == null
              ) {
                setReasonTouched(false);
              }
            }}
            placeholder="Ej. Pago duplicado o registrado con monto incorrecto"
            required
            showCount
            status={reasonError ? 'error' : undefined}
            value={reason}
          />
          {reasonError ? (
            <FieldError id={reasonErrorId} role="alert">
              {reasonError}
            </FieldError>
          ) : null}
        </ReasonField>
        <ReasonField>
          <label htmlFor={evidenceInputId}>Evidencia o referencia</label>
          <TextArea
            id={evidenceInputId}
            aria-errormessage={evidenceError ? evidenceErrorId : undefined}
            aria-invalid={evidenceError ? 'true' : 'false'}
            autoSize={{ minRows: 2, maxRows: 4 }}
            disabled={submitting}
            maxLength={240}
            onBlur={() => setEvidenceTouched(true)}
            onChange={(event) => {
              const nextEvidence = event.target.value;
              setEvidence(nextEvidence);
              if (
                evidenceTouched &&
                getSupplierPaymentVoidEvidenceError(nextEvidence) == null
              ) {
                setEvidenceTouched(false);
              }
            }}
            placeholder="Ej. Ticket, comprobante, auditoría interna o enlace del caso"
            required
            showCount
            status={evidenceError ? 'error' : undefined}
            value={evidence}
          />
          {evidenceError ? (
            <FieldError id={evidenceErrorId} role="alert">
              {evidenceError}
            </FieldError>
          ) : null}
        </ReasonField>
      </VoidForm>
    </ModalShell>
  );
};

const VoidForm = styled.div`
  display: grid;
  gap: 16px;
`;

const ReasonField = styled.div`
  display: grid;
  gap: 8px;

  label {
    color: var(--ds-color-text-primary, #111);
    font-weight: 600;
  }
`;

const FieldError = styled.div`
  color: #cf1322;
  font-size: 12px;
`;
