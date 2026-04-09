import { faScaleBalanced } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { formatLimit } from '../subscription.utils';
import type { LimitRow } from '../subscription.types';

interface SubscriptionLimitsCardProps {
  limitRows: LimitRow[];
}

const formatUsage = (value: number | null) =>
  value == null ? 'Sin dato' : value.toLocaleString();

const formatRemaining = (row: LimitRow) => {
  if (row.limit == null) return 'Sin dato';
  if (row.limit < 0) return 'Ilimitado';
  if (row.usage == null) return 'Sin dato';
  return Math.max(0, row.limit - row.usage).toLocaleString();
};

export const SubscriptionLimitsCard = ({
  limitRows,
}: SubscriptionLimitsCardProps) => (
  <Card>
    <CardHeader>
      <CardIcon>
        <FontAwesomeIcon icon={faScaleBalanced} />
      </CardIcon>
      <CardTitle>Limites y uso</CardTitle>
    </CardHeader>

    {limitRows.length ? (
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Metrica</Th>
              <Th>Limite</Th>
              <Th>Uso actual</Th>
              <Th>Disponible</Th>
            </tr>
          </thead>
          <tbody>
            {limitRows.map((row) => (
              <tr key={row.key}>
                <Td>{row.label}</Td>
                <Td>{formatLimit(row.limit)}</Td>
                <Td>{formatUsage(row.usage)}</Td>
                <Td>
                  <RemainingBadge $warn={
                    row.limit != null &&
                    row.limit > 0 &&
                    row.usage != null &&
                    row.usage >= row.limit
                  }>
                    {formatRemaining(row)}
                  </RemainingBadge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
    ) : (
      <EmptyState>Sin limites disponibles en el snapshot actual.</EmptyState>
    )}
  </Card>
);

export default SubscriptionLimitsCard;

const Card = styled.section`
  display: grid;
  gap: 16px;
  padding: 22px;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 22px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 12px 36px rgb(15 23 42 / 5%);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CardIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #ede9fe;
  color: #6d28d9;
  font-size: 14px;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 10px 14px;
  text-align: left;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid rgb(148 163 184 / 18%);
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 10px 14px;
  color: #0f172a;
  font-size: 0.9rem;
  border-bottom: 1px solid rgb(148 163 184 / 10%);

  tr:last-child & {
    border-bottom: none;
  }
`;

const RemainingBadge = styled.span<{ $warn: boolean }>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${(p) => (p.$warn ? '#fee2e2' : '#f0fdf4')};
  color: ${(p) => (p.$warn ? '#991b1b' : '#166534')};
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 18px 0;
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
`;
