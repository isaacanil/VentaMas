import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Modal } from 'antd';

import { formatMoney } from '../subscription.utils';
import { BillingInvoiceStatusBadge } from './BillingInvoiceStatusBadge';
import type { BillingInvoice } from './SubscriptionBillingCard.types';
import {
  ModalBody,
  ModalTop,
  ModalInvoiceNumber,
  ModalInvoiceDate,
  ModalDivider,
  DetailRows,
  DetailRowWrapper,
  DetailLabel,
  DetailValue,
  ModalTotal,
  ModalTotalLabel,
  ModalTotalValue,
  ModalActions,
} from './SubscriptionBillingCard.styles';

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <DetailRowWrapper>
    <DetailLabel>{label}</DetailLabel>
    <DetailValue>{value}</DetailValue>
  </DetailRowWrapper>
);

interface BillingInvoiceDetailModalProps {
  invoice: BillingInvoice | null;
  currency: string;
  canManagePayments: boolean;
  portalLoading: boolean;
  onOpenPortal: () => void | Promise<boolean>;
  onClose: () => void;
}

export const BillingInvoiceDetailModal = ({
  invoice,
  currency,
  canManagePayments,
  portalLoading,
  onOpenPortal,
  onClose,
}: BillingInvoiceDetailModalProps) => (
  <Modal
    open={invoice !== null}
    onCancel={onClose}
    title="Detalle de Factura"
    footer={null}
    width={480}
  >
    {invoice && (
      <ModalBody>
        <ModalTop>
          <div>
            <ModalInvoiceNumber>{invoice.number}</ModalInvoiceNumber>
            <ModalInvoiceDate>{invoice.date}</ModalInvoiceDate>
          </div>
          <BillingInvoiceStatusBadge status={invoice.status} />
        </ModalTop>

        <ModalDivider />

        <DetailRows>
          <DetailRow label="Plan" value={invoice.plan} />
          <DetailRow
            label="Monto"
            value={formatMoney(invoice.amount, currency)}
          />
          <DetailRow label="Proveedor" value={invoice.method} />
          <DetailRow label="Descripción" value={invoice.description} />
          <DetailRow
            label="Referencia"
            value={invoice.reference || invoice.number}
          />
        </DetailRows>

        <ModalDivider />

        <ModalTotal>
          <ModalTotalLabel>Total</ModalTotalLabel>
          <ModalTotalValue>
            {formatMoney(invoice.amount, currency)}
          </ModalTotalValue>
        </ModalTotal>

        <ModalActions>
          <Button
            type="primary"
            icon={<FontAwesomeIcon icon={faDownload} />}
            style={{ flex: 1 }}
            disabled={!canManagePayments}
            loading={portalLoading}
            onClick={() => {
              onOpenPortal();
            }}
          >
            Abrir portal
          </Button>
          <Button style={{ flex: 1 }} onClick={onClose}>
            Cerrar
          </Button>
        </ModalActions>
      </ModalBody>
    )}
  </Modal>
);
