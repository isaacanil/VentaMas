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
  background: #ede9fe;
  color: #6d28d9;
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

export const Td = styled.td`
  padding: 10px 14px;
  border-bottom: 1px solid rgb(148 163 184 / 10%);
  color: #0f172a;
  font-size: 0.9rem;

  tr:last-child & {
    border-bottom: none;
  }
`;

export const RemainingBadge = styled.span<{ $warn: boolean }>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: ${(p) => (p.$warn ? '#fee2e2' : '#f0fdf4')};
  color: ${(p) => (p.$warn ? '#991b1b' : '#166534')};
  font-size: 12px;
  font-weight: 600;
`;

export const EmptyState = styled.p`
  margin: 0;
  padding: 18px 0;
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
`;
