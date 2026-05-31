import styled from 'styled-components';

export const Card = styled.section`
  display: grid;
  gap: 16px;
  padding: 22px;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 22px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 12px 36px rgb(15 23 42 / 5%);
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const CardIcon = styled.div`
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #fef3c7;
  color: #92400e;
  font-size: 14px;
`;

export const CardTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const Th = styled.th`
  padding: 10px 14px;
  border-bottom: 1px solid rgb(148 163 184 / 18%);
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const Td = styled.td<{ $muted?: boolean }>`
  padding: 10px 14px;
  border-bottom: 1px solid rgb(148 163 184 / 10%);
  color: ${(p) => (p.$muted ? '#64748b' : '#0f172a')};
  font-size: 0.9rem;

  tr:last-child & {
    border-bottom: none;
  }
`;

export const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
`;

export const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

export const PageInfo = styled.span`
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
`;

export const EmptyState = styled.p`
  margin: 0;
  padding: 18px 0;
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
`;
