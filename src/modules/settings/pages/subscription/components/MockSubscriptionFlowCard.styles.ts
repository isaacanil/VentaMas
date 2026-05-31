import styled from 'styled-components';

export const Stack = styled.div`
  display: grid;
  gap: 16px;
`;

export const Field = styled.div`
  display: grid;
  gap: 6px;
`;

export const FieldLabel = styled.span`
  color: #64748b;
  font-size: 0.83rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

export const PaymentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const SwitchLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #334155;
  font-size: 0.9rem;
`;
