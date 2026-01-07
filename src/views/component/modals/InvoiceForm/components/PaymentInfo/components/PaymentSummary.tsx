// @ts-nocheck
import styled from 'styled-components';

interface BalanceSummary {
  label: string;
  variant: 'positive' | 'negative';
  formatted: string;
}

interface PaymentSummaryProps {
  formattedTotalPurchase: string;
  formattedTotalPayment: string;
  balance: BalanceSummary;
}

export const PaymentSummary = ({
  formattedTotalPurchase,
  formattedTotalPayment,
  balance,
}: PaymentSummaryProps) => (
  <Summary>
    <SummaryItem>
      <SummaryLabel>Total compra</SummaryLabel>
      <SummaryValue>{formattedTotalPurchase}</SummaryValue>
    </SummaryItem>
    <SummaryItem>
      <SummaryLabel>Total pagado</SummaryLabel>
      <SummaryValue>{formattedTotalPayment}</SummaryValue>
    </SummaryItem>
    <SummaryItem $variant={balance.variant}>
      <SummaryLabel $variant={balance.variant}>{balance.label}</SummaryLabel>
      <SummaryValue $variant={balance.variant}>
        {balance.formatted}
      </SummaryValue>
    </SummaryItem>
  </Summary>
);

const Summary = styled.div`
  display: grid;
  gap: 0.75rem;

  @media (width >= 768px) {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
`;

const SummaryItem = styled.div<{ $variant?: 'positive' | 'negative' }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  text-align: center;
  background: ${({ $variant }) => {
    if ($variant === 'positive') return '#d3faacff';
    if ($variant === 'negative') return '#ffc8deff';
    return '#f3f3f3';
  }};
  border-radius: 8px;
`;

const SummaryLabel = styled.span<{ $variant?: 'positive' | 'negative' }>`
  font-size: 12px;
  color: ${({ $variant }) => {
    if ($variant === 'positive') return '#237804';
    if ($variant === 'negative') return '#a8071a';
    return '#3a3a3a';
  }};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const SummaryValue = styled.span<{ $variant?: 'positive' | 'negative' }>`
  font-size: 16px;
  font-weight: 600;
  color: ${({ $variant }) => {
    if ($variant === 'positive') return '#135200';
    if ($variant === 'negative') return '#a50e43';
    return '#262626';
  }};
`;
