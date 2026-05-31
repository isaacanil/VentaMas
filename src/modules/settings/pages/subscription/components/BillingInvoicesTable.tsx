import { faDownload, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';

import { formatMoney } from '../subscription.utils';
import { BillingInvoiceStatusBadge } from './BillingInvoiceStatusBadge';
import type { BillingInvoice } from './SubscriptionBillingCard.types';
import {
  TableCard,
  TableWrapper,
  Table,
  Th,
  ThRight,
  Tr,
  Td,
  TdRight,
  InvoiceLink,
  ActionGroup,
  EmptyState,
} from './SubscriptionBillingCard.styles';

interface BillingInvoicesTableProps {
  invoices: BillingInvoice[];
  currency: string;
  canManagePayments: boolean;
  portalLoading: boolean;
  onOpenPortal: () => void | Promise<boolean>;
  onSelectInvoice: (invoice: BillingInvoice) => void;
}

export const BillingInvoicesTable = ({
  invoices,
  currency,
  canManagePayments,
  portalLoading,
  onOpenPortal,
  onSelectInvoice,
}: BillingInvoicesTableProps) => (
  <TableCard>
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th>Factura</Th>
            <Th>Fecha</Th>
            <Th>Plan</Th>
            <Th>Monto</Th>
            <Th>Estado</Th>
            <ThRight>Acciones</ThRight>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice, index) => (
            <Tr key={invoice.id} $last={index === invoices.length - 1}>
              <Td>
                <InvoiceLink
                  type="button"
                  onClick={() => onSelectInvoice(invoice)}
                >
                  {invoice.number}
                </InvoiceLink>
              </Td>
              <Td $muted>{invoice.date}</Td>
              <Td>{invoice.plan}</Td>
              <Td $bold>{formatMoney(invoice.amount, currency)}</Td>
              <Td>
                <BillingInvoiceStatusBadge status={invoice.status} />
              </Td>
              <TdRight>
                <ActionGroup>
                  <Button
                    type="text"
                    size="small"
                    icon={<FontAwesomeIcon icon={faFileLines} />}
                    onClick={() => onSelectInvoice(invoice)}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<FontAwesomeIcon icon={faDownload} />}
                    disabled={!canManagePayments}
                    loading={portalLoading}
                    onClick={() => {
                      onOpenPortal();
                    }}
                  />
                </ActionGroup>
              </TdRight>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrapper>

    {invoices.length === 0 && (
      <EmptyState>
        <FontAwesomeIcon icon={faFileLines} />
        <span>No se encontraron facturas</span>
      </EmptyState>
    )}
  </TableCard>
);
