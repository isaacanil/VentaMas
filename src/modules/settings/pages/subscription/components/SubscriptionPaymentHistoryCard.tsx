import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardIcon,
  CardTitle,
  EmptyState,
  PageInfo,
  Pagination,
  StatusPill,
  Table,
  TableWrapper,
  Td,
  Th,
} from './SubscriptionPaymentHistoryCard.styles';

import { formatDateTime, formatMoney } from '../subscription.utils';
import type { PaymentRow } from '../subscription.types';

const PAGE_SIZE = 8;

interface SubscriptionPaymentHistoryCardProps {
  paymentRows: PaymentRow[];
}

export const SubscriptionPaymentHistoryCard = ({
  paymentRows,
}: SubscriptionPaymentHistoryCardProps) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(paymentRows.length / PAGE_SIZE));
  const visible = paymentRows.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <Card>
      <CardHeader>
        <CardIcon>
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
        </CardIcon>
        <CardTitle>Historial de pagos</CardTitle>
      </CardHeader>

      {paymentRows.length ? (
        <>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Monto</Th>
                  <Th>Estado</Th>
                  <Th>Proveedor</Th>
                  <Th>Descripcion</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.key}>
                    <Td>{formatDateTime(row.createdAt)}</Td>
                    <Td>{formatMoney(row.amount, row.currency)}</Td>
                    <Td>
                      <StatusPill>{row.status.toUpperCase()}</StatusPill>
                    </Td>
                    <Td>{row.provider}</Td>
                    <Td $muted>{row.description}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
          {totalPages > 1 ? (
            <Pagination>
              <Button
                size="small"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <PageInfo>
                {page + 1} / {totalPages}
              </PageInfo>
              <Button
                size="small"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </Pagination>
          ) : null}
        </>
      ) : (
        <EmptyState>Sin pagos registrados</EmptyState>
      )}
    </Card>
  );
};

export default SubscriptionPaymentHistoryCard;
