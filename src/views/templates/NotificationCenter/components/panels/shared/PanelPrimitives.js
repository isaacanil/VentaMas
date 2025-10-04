import styled from 'styled-components';

export const PanelCard = styled.div`
  background: #ffffff;
  padding: 12px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  gap: 12px;
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
`;

export const PanelTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PanelMetaGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

export const PanelMetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
  text-align: right;
`;

export const PanelMetaLabel = styled.span`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
`;

export const PanelMetaValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
`;

export const ScrollArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
`;

export const PanelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background: #ffffff;
    border-color: #cbd5e1;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
  }

  @media (max-width: 960px) {
    flex-wrap: wrap;
    align-items: flex-start;
    row-gap: 10px;
  }
`;

export const RowMain = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 240px;
  min-width: 0;
`;

export const RowMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 0 0 160px;
  min-width: 120px;
`;

export const RowStatus = styled(RowMeta)`
  align-items: flex-start;
  flex: 0 0 140px;
  min-width: 120px;
`;

export const RowActions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 0 0 auto;
`;

export const ModuleIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 16px;
  flex-shrink: 0;
`;

export const ModuleInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const ModuleTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const ReferenceLabel = styled.div`
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ReferenceValue = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

export const StatusPill = styled.span`
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => $color || '#2563eb'};
  background: ${({ $color }) => `${$color || '#2563eb'}1a`};
  text-transform: capitalize;
`;

export const MetaLabel = styled.span`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
`;

export const MetaValue = styled.span`
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
