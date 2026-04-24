import {
  faCalendarAlt,
  faFileInvoice,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ProfileOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { DateTime } from 'luxon';
import styled from 'styled-components';

import type { InvoiceData } from '@/types/invoice';
import { resolveInvoiceDateMillis } from '@/utils/invoice/date';

interface InvoiceDocumentHeaderProps {
  canOpenAccountingEntry?: boolean;
  invoice?: InvoiceData | null;
  onOpenAccountingEntry?: () => void;
}

export const InvoiceDocumentHeader = ({
  canOpenAccountingEntry = false,
  invoice,
  onOpenAccountingEntry,
}: InvoiceDocumentHeaderProps) => {
  const ncf = invoice?.NCF || invoice?.comprobante || 'N/A';
  const invoiceNumber =
    invoice?.numberID ??
    (typeof invoice?.number === 'string' || typeof invoice?.number === 'number'
      ? invoice.number
      : 'N/A');
  const invoiceMillis = resolveInvoiceDateMillis(invoice?.date);
  const date = invoiceMillis
    ? DateTime.fromMillis(invoiceMillis).toFormat('dd/MM/yyyy')
    : 'N/A';

  return (
    <Container>
      <HeaderCard>
        <HeaderItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faFileInvoice} />
          </IconWrapper>
          <InfoContent>
            <Label>NCF</Label>
            <Value>{ncf}</Value>
          </InfoContent>
        </HeaderItem>

        <Divider />

        <HeaderItem>
          <InfoContent>
            <Label>Factura</Label>
            <Value>#{invoiceNumber}</Value>
          </InfoContent>
        </HeaderItem>

        <Divider />

        <HeaderItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faCalendarAlt} />
          </IconWrapper>
          <InfoContent>
            <Label>Fecha</Label>
            <Value>{date}</Value>
          </InfoContent>
        </HeaderItem>

        {canOpenAccountingEntry ? (
          <>
            <Divider />
            <ActionSlot>
              <Tooltip title="Ver asiento contable">
                <Button
                  icon={<ProfileOutlined />}
                  onClick={onOpenAccountingEntry}
                >
                  Ver asiento
                </Button>
              </Tooltip>
            </ActionSlot>
          </>
        ) : null}
      </HeaderCard>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
`;

const HeaderCard = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);
`;

const ActionSlot = styled.div`
  flex-shrink: 0;
`;

const HeaderItem = styled.div`
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
`;

const IconWrapper = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 14px;
  color: #1890ff;
  background: #f0f5ff;
  border-radius: 6px;
`;

const InfoContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const Label = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const Value = styled.div`
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Divider = styled.div`
  flex-shrink: 0;
  width: 1px;
  height: 32px;
  background: #e8e8e8;
`;
