// @ts-nocheck
import styled from 'styled-components';

export const StyledProgress = styled.div`
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-top: 12px;
  margin-bottom: 8px;
`;

export const StyledProgressBar = styled.div`
  height: 100%;
  background-color: #52c41a;
  width: ${props => props.percent}%;
  transition: width 0.3s ease;
  border-radius: 4px;
`;

export const StyledAlert = styled.div`
  padding: 12px 16px;
  background-color: ${props => props.type === 'error' ? '#fff1f0' : props.type === 'info' ? '#e6f7ff' : '#f6ffed'};
  border: 1px solid ${props => props.type === 'error' ? '#ffa39e' : props.type === 'info' ? '#91d5ff' : '#b7eb8f'};
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  font-size: 14px;
  
  .alert-icon {
    color: ${props => props.type === 'error' ? '#ff4d4f' : props.type === 'info' ? '#1890ff' : '#52c41a'};
    font-size: 16px;
    margin-top: 2px;
  }
  
  .alert-content {
    flex: 1;
  }
  
  .alert-message {
    font-weight: 600;
    color: #262626;
    margin-bottom: 4px;
  }
  
  .alert-description {
    font-size: 13px;
    color: #595959;
  }
`;

export const StyledTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  height: 22px;
  font-size: 12px;
  border-radius: 4px;
  background-color: ${props => props.color === 'error' ? '#fff1f0' : '#e6f7ff'};
  color: ${props => props.color === 'error' ? '#ff4d4f' : '#1890ff'};
  border: 1px solid ${props => props.color === 'error' ? '#ffa39e' : '#91d5ff'};
  margin-left: 8px;
  white-space: nowrap;
`;

export const StyledDivider = styled.div`
  height: 1px;
  background-color: #f0f0f0;
  width: 100%;
`;

export const StyledSpace = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// ========== ZONA A: Hero Financiero (KPIs) ==========
export const HeroKPIContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`;

export const KPICard = styled.div`
  padding: 12px;
  background: ${(props) => props.background || '#fafafa'};
  border-radius: 12px;
  border: 2px solid ${(props) => props.borderColor || '#e8e8e8'};
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
    font-size: ${(props) => (props.isPrimary ? '24px' : '20px')};
    font-weight: 700;
    color: ${(props) => props.color || '#262626'};
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
    background: ${(props) => props.statusBg || 'transparent'};
    color: ${(props) => props.statusColor || '#666'};
  }
`;

// ========== ZONA B: Contexto y Contacto ==========
export const ContextContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
`;

export const ContextPanel = styled.div`
  padding: 20px;
  background: ${(props) => props.background || '#fafafa'};
  border-radius: 12px;
  border: 1px solid #e8e8e8;

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
    font-size: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .info-label {
    min-width: 100px;
    font-weight: 500;
    color: #8c8c8c;
  }

  .info-value {
    flex: 1;
    color: #262626;
    font-weight: 500;
  }

  .quick-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e8e8e8;
  }
`;

// ========== ZONA C: Timeline y Acciones ==========
export const TimelineContainer = styled.div`
  padding: 20px;
  background: #fafafa;
  border-radius: 12px;
  margin-bottom: 16px;

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .timeline-title {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .timeline-info {
    font-size: 12px;
    color: #8c8c8c;
  }
`;

export const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
`;

export const TableCard = styled.div`
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;

  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    font-weight: 600;
    color: #595959;
    font-size: 13px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead tr {
    background: #fafafa;
  }

  th,
  td {
    padding: 12px 16px;
    font-size: 13px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }

  th {
    color: #8c8c8c;
    font-weight: 600;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: #fafafa;
  }

  .numeric {
    text-align: right;
  }
`;

export const HighlightCard = styled.div`
  background: ${(props) => props.$bg || '#f9f9f9'};
  border: 1px solid ${(props) => props.$border || '#f0f0f0'};
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  color: #262626;

  .icon-area {
    font-size: 24px;
    color: ${(props) => props.$iconColor || '#8c8c8c'};
    margin-top: 2px;
  }

  .content-area {
    flex: 1;
  }

  .title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 4px;
    color: #262626;
  }

  .subtitle {
    color: #8c8c8c;
    font-size: 13px;
  }
`;

