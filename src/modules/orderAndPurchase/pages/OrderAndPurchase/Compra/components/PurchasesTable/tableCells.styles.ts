import styled from 'styled-components';

export const ActionsCellWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

export const TotalPaymentCellWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
`;

export const PaymentStatusLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
`;

export const PaymentDateCellWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
`;

export const PaymentDateTextGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const PrimaryPaymentDate = styled.span`
  font-size: 13px;
  font-weight: 500;
`;

export const SecondaryPaymentDate = styled.span`
  font-size: 11px;
  color: #888;
`;
