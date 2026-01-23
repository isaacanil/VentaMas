import styled from 'styled-components';

interface UserActivitySummaryProps {
  lastLoginLabel: string;
  lastLogoutLabel: string;
  sessionsCount: number;
}

export const UserActivitySummary = ({
  lastLoginLabel,
  lastLogoutLabel,
  sessionsCount,
}: UserActivitySummaryProps) => (
  <SummaryGrid>
    <SummaryCard>
      <Label>Ultimo inicio</Label>
      <Value>{lastLoginLabel}</Value>
    </SummaryCard>
    <SummaryCard>
      <Label>Ultimo cierre</Label>
      <Value>{lastLogoutLabel}</Value>
    </SummaryCard>
    <SummaryCard>
      <Label>Sesiones registradas</Label>
      <Value>{sessionsCount}</Value>
    </SummaryCard>
  </SummaryGrid>
);

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
`;

const SummaryCard = styled.div`
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme?.bg?.primary || '#fff'};
  border: 1px solid
    ${({ theme }) => theme?.border?.primary || 'rgba(0,0,0,0.06)'};
  border-radius: 10px;
`;

const Label = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme?.palette?.text?.secondary || '#4b5563'};
`;

const Value = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme?.palette?.text?.primary || '#111827'};
`;
