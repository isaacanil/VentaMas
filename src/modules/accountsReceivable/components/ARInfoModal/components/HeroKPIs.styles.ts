import styled from 'styled-components';

export const HeroKPIContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

export const KPICard = styled.div<{
  background?: string;
  borderColor?: string;
  color?: string;
  statusBg?: string;
  statusColor?: string;
  isPrimary?: boolean;
}>`
  padding: 12px;
  background: ${(props: { background?: string }) =>
    props.background || '#fafafa'};
  border-radius: 12px;
  border: 2px solid
    ${(props: { borderColor?: string }) => props.borderColor || '#e8e8e8'};
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
  }

  .kpi-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 500;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .kpi-amount {
    font-size: ${(props: { isPrimary?: boolean }) =>
      props.isPrimary ? '24px' : '20px'};
    font-weight: 700;
    color: ${(props: { color?: string }) => props.color || '#262626'};
    margin-bottom: 4px;
    line-height: 1;
  }

  .kpi-status {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    background: ${(props: { statusBg?: string }) =>
      props.statusBg || 'transparent'};
    color: ${(props: { statusColor?: string }) => props.statusColor || '#666'};
  }
`;
