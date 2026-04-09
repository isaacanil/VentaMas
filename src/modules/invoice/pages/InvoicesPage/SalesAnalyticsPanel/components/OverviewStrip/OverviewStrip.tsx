import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

type MetricItem = {
  label: string;
  value: string;
  detail?: string;
};

type OverviewStripProps = {
  sales: number;
  paid: number;
  pending: number;
  averageTicket: number;
  invoices: number;
  customers: number;
};

export const OverviewStrip = ({
  sales,
  paid,
  pending,
  averageTicket,
  invoices,
  customers,
}: OverviewStripProps) => {
  const metrics: MetricItem[] = [
    {
      label: 'Facturacion',
      value: formatPrice(sales),
      detail: 'Monto total del rango filtrado',
    },
    {
      label: 'Cobrado',
      value: formatPrice(paid),
      detail: 'Pagos aplicados sobre estas facturas',
    },
    {
      label: 'Pendiente',
      value: formatPrice(pending),
      detail: 'Saldo abierto por cobrar',
    },
    {
      label: 'Ticket promedio',
      value: formatPrice(averageTicket),
      detail: 'Promedio por factura',
    },
    {
      label: 'Facturas',
      value: new Intl.NumberFormat('es-DO').format(invoices),
      detail: 'Cantidad de comprobantes',
    },
    {
      label: 'Clientes',
      value: new Intl.NumberFormat('es-DO').format(customers),
      detail: 'Clientes unicos en el rango',
    },
  ];

  return (
    <Container>
      {metrics.map((metric) => (
        <Metric key={metric.label}>
          <MetricLabel>{metric.label}</MetricLabel>
          <MetricValue>{metric.value}</MetricValue>
          {metric.detail ? <MetricDetail>{metric.detail}</MetricDetail> : null}
        </Metric>
      ))}
    </Container>
  );
};

const Container = styled.section`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  background: var(--white);
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 10px;

  @media (width <= 1200px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (width <= 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (width <= 420px) {
    grid-template-columns: 1fr;
  }
`;

const Metric = styled.div`
  display: grid;
  gap: 0.3rem;
  padding: 1rem 1.1rem;
  min-width: 0;
  border-right: 1px solid rgb(15 23 42 / 8%);

  &:last-child {
    border-right: none;
  }

  @media (width <= 1200px) {
    &:nth-child(3n) {
      border-right: none;
    }

    &:nth-child(n + 4) {
      border-top: 1px solid rgb(15 23 42 / 8%);
    }
  }

  @media (width <= 640px) {
    &:nth-child(3n) {
      border-right: 1px solid rgb(15 23 42 / 8%);
    }

    &:nth-child(2n) {
      border-right: none;
    }

    &:nth-child(n + 3) {
      border-top: 1px solid rgb(15 23 42 / 8%);
    }
  }

  @media (width <= 420px) {
    border-right: none;

    &:not(:first-child) {
      border-top: 1px solid rgb(15 23 42 / 8%);
    }
  }
`;

const MetricLabel = styled.span`
  color: var(--gray-7);
  font-size: 0.78rem;
  font-weight: 500;
`;

const MetricValue = styled.strong`
  overflow: hidden;
  color: var(--black-3);
  font-size: 1.25rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MetricDetail = styled.span`
  color: var(--gray-6);
  font-size: 0.74rem;
  line-height: 1.35;
`;
