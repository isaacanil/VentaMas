import { faScaleBalanced } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Card,
  CardHeader,
  CardIcon,
  CardTitle,
  EmptyState,
  RemainingBadge,
  Table,
  TableWrapper,
  Td,
  Th,
} from './SubscriptionLimitsCard.styles';

import type { LimitRow } from '../subscription.types';
import { formatLimit } from '../subscription.utils';

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

const isLimitReached = (row: LimitRow) =>
  row.limit != null &&
  row.limit > 0 &&
  row.usage != null &&
  row.usage >= row.limit;

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
                  <RemainingBadge $warn={isLimitReached(row)}>
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
