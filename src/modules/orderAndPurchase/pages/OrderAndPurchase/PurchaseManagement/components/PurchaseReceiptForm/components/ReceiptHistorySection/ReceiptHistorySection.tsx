import { HistoryOutlined } from '@ant-design/icons';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import styled from 'styled-components';

import type { PurchaseReceiptEvent, PurchaseReplenishment } from '@/utils/purchase/types';

import ReceiptEventCard from './ReceiptEventCard';
import {
  formatHistoryDateShort,
  formatHistoryTime,
  formatHistoryActor,
  formatQty,
  safeQty,
  sortReceiptEventsByDate,
} from './utils/receiptHistoryDisplay';

interface ReceiptHistorySectionProps {
  receiptHistory?: PurchaseReceiptEvent[];
}

type GroupRow = {
  key: string;
  isGroupRow: true;
  dateLabel: string;
};

type DataRow = {
  key: string;
  isGroupRow?: false;
  time: string;
  actor: string;
  warehouse: string | null;
  product: string;
  received: number;
};

type TableRowData = GroupRow | DataRow;

const buildTableData = (events: PurchaseReceiptEvent[]): TableRowData[] => {
  const rows: TableRowData[] = [];
  let currentDate = '';

  events.forEach((event, eventIdx) => {
    const dateShort = formatHistoryDateShort(event.receivedAt);
    const time = formatHistoryTime(event.receivedAt);
    const actor = formatHistoryActor(event.receivedBy);
    const warehouse = event.warehouseName ?? null;
    const items: PurchaseReplenishment[] = Array.isArray(event.items) ? event.items : [];

    if (dateShort !== currentDate) {
      currentDate = dateShort;
      rows.push({
        key: `group-${dateShort}-${eventIdx}`,
        isGroupRow: true,
        dateLabel: dateShort,
      });
    }

    if (!items.length) {
      rows.push({
        key: `${event.id ?? eventIdx}-empty`,
        time,
        actor,
        warehouse,
        product: '—',
        received: safeQty(event.summary?.receivedQuantity),
      });
    } else {
      items.forEach((item, itemIdx) => {
        rows.push({
          key: `${event.id ?? eventIdx}-${item.id ?? itemIdx}`,
          time,
          actor,
          warehouse,
          product: item.name ?? 'Producto sin nombre',
          received: safeQty(item.receivedQuantity),
        });
      });
    }
  });

  return rows;
};

const COL_COUNT = 5;

const tableColumns: ColumnsType<TableRowData> = [
  {
    title: 'Hora',
    dataIndex: 'time',
    width: 70,
    render: (_v, record) => {
      if (record.isGroupRow) {
        return {
          children: <DateGroupCell>{record.dateLabel}</DateGroupCell>,
          props: { colSpan: COL_COUNT },
        };
      }
      return <span style={{ fontSize: 13, color: '#595959' }}>{record.time}</span>;
    },
  },
  {
    title: 'Producto',
    dataIndex: 'product',
    ellipsis: true,
    render: (_v, record) => {
      if (record.isGroupRow) return { children: null, props: { colSpan: 0 } };
      return <span style={{ fontSize: 13, fontWeight: 500 }}>{record.product}</span>;
    },
  },
  {
    title: 'Almacén',
    dataIndex: 'warehouse',
    width: 140,
    ellipsis: true,
    render: (_v, record) => {
      if (record.isGroupRow) return { children: null, props: { colSpan: 0 } };
      return (
        <span style={{ fontSize: 13, color: record.warehouse ? '#262626' : '#bfbfbf' }}>
          {record.warehouse ?? '—'}
        </span>
      );
    },
  },
  {
    title: 'Usuario',
    dataIndex: 'actor',
    width: 150,
    ellipsis: true,
    render: (_v, record) => {
      if (record.isGroupRow) return { children: null, props: { colSpan: 0 } };
      return <span style={{ fontSize: 13 }}>{record.actor}</span>;
    },
  },
  {
    title: 'Recibido',
    dataIndex: 'received',
    align: 'right',
    width: 90,
    render: (_v, record) => {
      if (record.isGroupRow) return { children: null, props: { colSpan: 0 } };
      return <span style={{ fontWeight: 600 }}>{formatQty(record.received)}</span>;
    },
  },
];

const ReceiptHistorySection = ({
  receiptHistory,
}: ReceiptHistorySectionProps) => {
  const events = sortReceiptEventsByDate(
    Array.isArray(receiptHistory) ? receiptHistory : [],
  );

  if (events.length === 0) return null;

  const tableData = buildTableData(events);

  return (
    <SectionWrapper>
      <SectionHeader>
        <SectionTitle>
          <HistoryOutlined />
          Historial de Recepciones
        </SectionTitle>
        <EventCount>
          {events.length} {events.length === 1 ? 'recepción' : 'recepciones'}
        </EventCount>
      </SectionHeader>

      {/* Desktop: tabla plana agrupada por fecha */}
      <DesktopView>
        <Table<TableRowData>
          size="small"
          columns={tableColumns}
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 700 }}
          rowClassName={(record) => (record.isGroupRow ? 'group-row' : '')}
        />
      </DesktopView>

      {/* Móvil: cards de línea de tiempo */}
      <MobileView>
        <Timeline>
          {events.map((event, idx) => (
            <ReceiptEventCard
              key={event.id ?? idx}
              event={event}
              index={idx}
              total={events.length}
            />
          ))}
        </Timeline>
      </MobileView>
    </SectionWrapper>
  );
};

export default ReceiptHistorySection;

// ─── Styles ───────────────────────────────────────────────────────────────────

const SectionWrapper = styled.div`
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  background: #ffffff;

  .group-row td {
    background: #f5f5f5 !important;
    padding-top: 6px !important;
    padding-bottom: 6px !important;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  display: flex;
  align-items: center;
  gap: 8px;

  .anticon {
    color: #1677ff;
    font-size: 15px;
  }
`;

const EventCount = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #8c8c8c;
  background: #f0f0f0;
  border-radius: 100px;
  padding: 2px 10px;
`;

const DateGroupCell = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #595959;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DesktopView = styled.div`
  display: none;

  @media (min-width: 769px) {
    display: block;
  }
`;

const MobileView = styled.div`
  display: block;

  @media (min-width: 769px) {
    display: none;
  }
`;

const Timeline = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
`;
