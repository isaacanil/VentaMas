import styled from 'styled-components';

export const PlanCard = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border: 1px solid rgb(13 148 136 / 25%);
  border-radius: 14px;
  background: #ffffff;
`;

export const PlanInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PlanTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const PlanName = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 600;
`;

export const ActiveBadge = styled.span<{
  $tone: 'active' | 'warning' | 'danger';
}>`
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid
    ${(p) =>
      p.$tone === 'active'
        ? 'rgb(13 148 136 / 30%)'
        : p.$tone === 'warning'
          ? 'rgb(217 119 6 / 25%)'
          : 'rgb(220 38 38 / 25%)'};
  background: ${(p) =>
    p.$tone === 'active'
      ? 'rgb(13 148 136 / 10%)'
      : p.$tone === 'warning'
        ? 'rgb(245 158 11 / 10%)'
        : 'rgb(220 38 38 / 10%)'};
  color: ${(p) =>
    p.$tone === 'active'
      ? '#0f766e'
      : p.$tone === 'warning'
        ? '#92400e'
        : '#991b1b'};
  font-size: 0.75rem;
  font-weight: 600;
`;

export const PlanDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
`;

export const PlanPrice = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

export const PlanAmount = styled.span`
  color: #0f172a;
  font-size: 1.75rem;
  font-weight: 700;
`;

export const PlanPeriod = styled.span`
  color: #64748b;
  font-size: 0.85rem;
`;

export const PlanActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;

export const BillingNote = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  text-align: center;
`;
