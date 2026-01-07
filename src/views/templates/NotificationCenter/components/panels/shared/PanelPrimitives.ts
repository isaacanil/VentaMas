import styled from 'styled-components';

export const PanelCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
`;

export const PanelHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;

export const PanelTitle = styled.h3`
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

export const PanelMetaGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
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
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const PanelMetaValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
`;

export const ScrollArea = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
  overflow-y: auto;

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
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: #fff;
    border-color: #cbd5e1;
    box-shadow: 0 8px 20px rgb(15 23 42 / 12%);
  }

  @media (width <= 960px) {
    flex-wrap: wrap;
    row-gap: 10px;
    align-items: flex-start;
  }
`;

export const RowMain = styled.div`
  display: flex;
  flex: 1 1 240px;
  gap: 12px;
  align-items: center;
  min-width: 0;
`;

export const RowMeta = styled.div`
  display: flex;
  flex: 0 0 160px;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
`;

export const RowStatus = styled(RowMeta)`
  flex: 0 0 140px;
  align-items: flex-start;
  min-width: 120px;
`;

export const RowActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
`;

export const ModuleIcon = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 16px;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 10px;
`;

export const ModuleInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const ModuleTitle = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
`;

export const ReferenceLabel = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
`;

export const ReferenceValue = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

export const StatusPill = styled.span`
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => $color || '#2563eb'};
  text-transform: capitalize;
  background: ${({ $color }) => `${$color || '#2563eb'}1a`};
  border-radius: 999px;
`;

export const MetaLabel = styled.span`
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const MetaValue = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
`;
