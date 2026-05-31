import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const Header = styled.div``;

export const HeaderTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 600;
`;

export const HeaderDesc = styled.p`
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.85rem;
`;

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

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
`;

export const SectionDesc = styled.p`
  margin: 3px 0 0;
  color: #64748b;
  font-size: 0.78rem;
`;

export const UsageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

export const UsageBox = styled.div`
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
`;

export const UsageBoxHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const UsageIconWrap = styled.div<{ $critical: boolean; $high: boolean }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 0.75rem;

  ${(p) =>
    p.$critical
      ? 'background: rgb(220 38 38 / 12%); color: #dc2626;'
      : p.$high
        ? 'background: rgb(217 119 6 / 12%); color: #d97706;'
        : 'background: rgb(13 148 136 / 12%); color: #0d9488;'}
`;

export const UsageLabel = styled.span`
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const UsageNumbers = styled.div`
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-top: 10px;
`;

export const UsageUsed = styled.span`
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 700;
`;

export const UsageLimit = styled.span`
  color: #94a3b8;
  font-size: 0.78rem;
`;

export const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  margin-top: 8px;
`;

export const ProgressFill = styled.div<{
  $pct: number;
  $critical: boolean;
  $high: boolean;
}>`
  width: ${(p) => p.$pct}%;
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
  background: ${(p) =>
    p.$critical ? '#dc2626' : p.$high ? '#d97706' : '#0d9488'};
`;

export const UsagePct = styled.p<{ $critical: boolean; $high: boolean }>`
  margin: 5px 0 0;
  font-size: 0.72rem;
  font-weight: ${(p) => (p.$critical ? 600 : 400)};
  color: ${(p) => (p.$critical ? '#dc2626' : p.$high ? '#d97706' : '#94a3b8')};
`;

export const EmptyUsage = styled.div`
  grid-column: 1 / -1;
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.82rem;
`;

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

export const StatCard = styled.div`
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
`;

export const StatCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const StatLabel = styled.span`
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 500;
`;

export const StatValue = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 1.4rem;
  font-weight: 700;
`;

export const StatMeta = styled.p`
  margin: 3px 0 0;
  color: #64748b;
  font-size: 0.75rem;
`;

export const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.div`
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const CardTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 600;
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const ActivityRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

export const ActivityIconWrap = styled.div`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  margin-top: 1px;
`;

export const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ActivityTitle = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 500;
`;

export const ActivityDesc = styled.p`
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.78rem;
`;

export const ActivityTime = styled.span`
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 0.72rem;
  padding-top: 2px;
`;

export const ActivityEmpty = styled.div`
  padding: 12px 0;
  color: #64748b;
  font-size: 0.82rem;
`;

export const QuickActionButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px;
  border: 1px solid ${(p) => (p.$danger ? 'rgb(220 38 38 / 20%)' : '#e2e8f0')};
  border-radius: 10px;
  background: ${(p) => (p.$danger ? 'rgb(254 242 242)' : '#f8fafc')};
  cursor: pointer;
  text-align: left;
  transition:
    background 0.12s,
    border-color 0.12s;
  color: #64748b;
  font-size: 0.8rem;

  &:hover {
    background: ${(p) => (p.$danger ? 'rgb(254 226 226)' : '#f1f5f9')};
    border-color: ${(p) => (p.$danger ? 'rgb(220 38 38 / 35%)' : '#cbd5e1')};
  }
`;

export const QuickActionLabel = styled.p<{ $danger?: boolean }>`
  margin: 0;
  color: ${(p) => (p.$danger ? '#dc2626' : '#0f172a')};
  font-size: 0.88rem;
  font-weight: 500;
`;

export const QuickActionDesc = styled.p`
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.75rem;
`;
