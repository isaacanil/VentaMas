import styled from 'styled-components';

import type { PurchaseReplenishment } from '@/utils/purchase/types';

import { formatQty, safeQty } from './utils/receiptHistoryDisplay';

interface ReceiptEventItemsProps {
  items: PurchaseReplenishment[];
}

const ReceiptEventItems = ({ items }: ReceiptEventItemsProps) => {
  if (!items.length) {
    return <EmptyItems>Sin detalle de productos en este evento.</EmptyItems>;
  }

  return (
    <ItemsGrid>
      <TableHeader>
        <ColName>Producto</ColName>
        <ColQty>Recibido</ColQty>
        <ColQty>Pendiente</ColQty>
      </TableHeader>
      {items.map((item, idx) => {
        const pending = safeQty(item.pendingQuantity);
        return (
          <ItemRow key={item.id ?? idx}>
            <ColName>{item.name ?? 'Producto sin nombre'}</ColName>
            <ColQty $received>{formatQty(item.receivedQuantity)}</ColQty>
            <ColQty $pending={pending > 0}>
              {formatQty(item.pendingQuantity)}
            </ColQty>
          </ItemRow>
        );
      })}
    </ItemsGrid>
  );
};

export default ReceiptEventItems;

// ─── Styles ───────────────────────────────────────────────────────────────────

const ItemsGrid = styled.div`
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  margin-top: 4px;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 100px;
  padding: 6px 12px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 100px;
  padding: 7px 12px;
  background-color: #ffffff;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #fafafe;
  }
`;

const ColName = styled.span`
  font-size: 13px;
  color: #262626;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
`;

interface ColQtyProps {
  $received?: boolean;
  $pending?: boolean;
}

const ColQty = styled.span<ColQtyProps>`
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  padding-right: 4px;
  color: ${({ $received, $pending }) => {
    if ($received) return '#262626';
    if ($pending === true) return '#faad14';
    return '#52c41a';
  }};

  /* header cells are rendered without props → muted */
  &:not([class*='ItemRow'] *) {
    font-size: 11px;
    font-weight: 700;
    color: #8c8c8c;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const EmptyItems = styled.p`
  margin: 0;
  padding: 12px 0;
  font-size: 13px;
  color: #bfbfbf;
  font-style: italic;
`;
