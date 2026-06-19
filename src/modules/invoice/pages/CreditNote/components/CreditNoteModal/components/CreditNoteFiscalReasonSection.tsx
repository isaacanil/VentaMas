import { Alert, Input, Select } from 'antd';
import React from 'react';
import styled from 'styled-components';

import {
  CREDIT_NOTE_TEXT_CORRECTION_AMOUNT_MESSAGE,
  CREDIT_NOTE_TEXT_CORRECTION_CODE,
  hasPositiveCreditNoteAmount,
  isCreditNoteTextCorrectionWithAmount,
} from '../utils/modificationCode';

const DGII_MODIFICATION_CODE_OPTIONS = [
  { value: '1', label: '1 - Anula NCF modificado' },
  { value: '2', label: '2 - Corrige texto' },
  { value: '3', label: '3 - Corrige montos' },
  { value: '4', label: '4 - Reemplaza contingencia' },
  { value: '5', label: '5 - Factura consumo electronica' },
];

interface CreditNoteFiscalReasonSectionProps {
  reason: string;
  modificationCode: string;
  totalAmount: number;
  disabled: boolean;
  onReasonChange: (value: string) => void;
  onModificationCodeChange: (value: string) => void;
}

export const CreditNoteFiscalReasonSection = ({
  reason,
  modificationCode,
  totalAmount,
  disabled,
  onReasonChange,
  onModificationCodeChange,
}: CreditNoteFiscalReasonSectionProps) => {
  const hasPositiveAmount = hasPositiveCreditNoteAmount(totalAmount);
  const hasTextCorrectionAmountConflict = isCreditNoteTextCorrectionWithAmount({
    modificationCode,
    totalAmount,
  });
  const modificationCodeOptions = DGII_MODIFICATION_CODE_OPTIONS.map(
    (option) =>
      option.value === CREDIT_NOTE_TEXT_CORRECTION_CODE
        ? {
            ...option,
            disabled: hasPositiveAmount,
            label: hasPositiveAmount
              ? '2 - Corrige texto (solo sin monto)'
              : option.label,
          }
        : option,
  );

  return (
    <Section>
      <Field>
        <Label htmlFor="credit-note-modification-code">Código DGII</Label>
        <Select
          id="credit-note-modification-code"
          value={modificationCode}
          options={modificationCodeOptions}
          disabled={disabled}
          status={hasTextCorrectionAmountConflict ? 'error' : undefined}
          onChange={onModificationCodeChange}
        />
      </Field>
      <Field>
        <Label htmlFor="credit-note-reason">Motivo</Label>
        <Input.TextArea
          id="credit-note-reason"
          value={reason}
          rows={2}
          maxLength={120}
          showCount
          disabled={disabled}
          placeholder="Corrección o devolución aplicada"
          onChange={(event) => onReasonChange(event.target.value)}
        />
      </Field>
      {hasTextCorrectionAmountConflict && (
        <Alert
          type="warning"
          showIcon
          message="Código DGII no compatible con monto"
          description={CREDIT_NOTE_TEXT_CORRECTION_AMOUNT_MESSAGE}
        />
      )}
    </Section>
  );
};

const Section = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  gap: 1rem;

  .ant-alert {
    grid-column: 1 / -1;
  }

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;
