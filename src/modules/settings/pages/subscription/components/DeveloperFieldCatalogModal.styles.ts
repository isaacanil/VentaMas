import { Button } from 'antd';
import styled from 'styled-components';

export const ModalDescription = styled.p`
  margin: 0 0 16px;
  font-size: 0.85rem;
  color: #64748b;
`;

export const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
`;

export const FieldList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const FieldRow = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
`;

export const FieldOrderControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-shrink: 0;
  padding-top: 2px;
`;

export const OrderBtn = styled(Button)`
  width: 20px !important;
  height: 18px !important;
  min-width: 20px !important;
  padding: 0 !important;
  font-size: 9px !important;
  color: #94a3b8;

  &:not(:disabled):hover {
    color: #0f172a !important;
  }
`;

export const FieldBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

export const FieldHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  flex-wrap: wrap;
`;

export const FieldKey = styled.span`
  font-family: monospace;
  font-size: 0.72rem;
  color: #64748b;
`;

export const TypeBadge = styled.span<{ $type: 'number' | 'boolean' }>`
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
  background: ${(p) =>
    p.$type === 'number' ? 'rgb(59 130 246 / 10%)' : 'rgb(13 148 136 / 10%)'};
  color: ${(p) => (p.$type === 'number' ? '#1d4ed8' : '#0f766e')};
`;

export const FieldControls = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
`;

export const ControlLabel = styled.span`
  font-size: 0.78rem;
`;
