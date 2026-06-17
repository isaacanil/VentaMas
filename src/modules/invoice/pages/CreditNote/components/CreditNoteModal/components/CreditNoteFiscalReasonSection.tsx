import { Input, Select } from 'antd';
import React from 'react';
import styled from 'styled-components';

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
  disabled: boolean;
  onReasonChange: (value: string) => void;
  onModificationCodeChange: (value: string) => void;
}

export const CreditNoteFiscalReasonSection = ({
  reason,
  modificationCode,
  disabled,
  onReasonChange,
  onModificationCodeChange,
}: CreditNoteFiscalReasonSectionProps) => (
  <Section>
    <Field>
      <Label htmlFor="credit-note-modification-code">Código DGII</Label>
      <Select
        id="credit-note-modification-code"
        value={modificationCode}
        options={DGII_MODIFICATION_CODE_OPTIONS}
        disabled={disabled}
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
  </Section>
);

const Section = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  gap: 1rem;

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
