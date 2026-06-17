import styled from 'styled-components';

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
