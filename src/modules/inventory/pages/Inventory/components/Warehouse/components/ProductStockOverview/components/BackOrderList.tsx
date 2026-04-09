import {
  faBoxes,
  faClock,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Spin, Modal, Button, Progress, Tooltip } from 'antd';
import { DateTime } from 'luxon';
import { useState } from 'react';
import styled from 'styled-components';

import { useBackOrdersByProduct } from '@/firebase/warehouse/backOrderService';

const Widget = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-radius: 8px;

    .view-more {
      opacity: 1;
    }
  }

  .header {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 0.9rem;
    color: #64748b;

    .icon {
      color: #94a3b8;
    }
  }
`;

const OrdersBar = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;

  .bar {
    display: flex;
    flex: 1;
    height: 24px;
    overflow: hidden;
    background: #f1f5f9;
    border-radius: 12px;
  }

  .progress {
    height: 100%;
    background: #0ea5e9;
    transition: width 0.3s ease;
  }

  .total {
    min-width: 70px;
    font-size: 0.9rem;
    font-weight: 500;
    color: #0f172a;
    text-align: right;
  }
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DetailItem = styled.div`
  position: relative;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;

  .date {
    margin-bottom: 12px;
    font-size: 0.85rem;
    color: #64748b;
  }

  .top-info {
    position: absolute;
    top: 12px;
    right: 12px;
  }

  .quantities {
    font-size: 0.9rem;
    color: #0f172a;
  }
`;

const StatusPill = styled.span`
  padding: 2px 8px;
  margin-left: 8px;
  font-size: 0.75rem;
  color: #00695c;
  background: #e0f7fa;
  border-radius: 12px;
`;

type BackOrderListProps = {
  productId?: string | null;
};

type BackOrderItem = ReturnType<typeof useBackOrdersByProduct>['data'][number];

const BackOrderList = ({ productId }: BackOrderListProps) => {
  // Agregar mapeo de estados para la interfaz en español
  const statusMapping: Record<string, string> = {
    pending: 'Pendiente',
    reserved: 'Reservado',
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    data: backOrders,
    loading,
    error,
  } = useBackOrdersByProduct(productId ?? null);

  if (loading) return <Spin size="small" />;
  if (error || !backOrders?.length) return null;

  const totalInitial = backOrders.reduce(
    (sum, order) => sum + Number(order.initialQuantity ?? 0),
    0,
  );
  const totalPending = backOrders.reduce(
    (sum, order) => sum + Number(order.pendingQuantity ?? 0),
    0,
  );
  const progress =
    totalInitial > 0
      ? Math.round(((totalInitial - totalPending) / totalInitial) * 100)
      : 0;

  return (
    <>
      <Widget onClick={() => setIsModalOpen(true)}>
        <div className="header">
          <FontAwesomeIcon icon={faBoxes} className="icon" />
          <span>Reservas por Abonar ({backOrders.length})</span>
          <Button
            type="link"
            size="small"
            className="view-more"
            style={{
              marginLeft: 'auto',
              opacity: 0,
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Ver detalles
            <FontAwesomeIcon icon={faChevronRight} />
          </Button>
        </div>
        <OrdersBar>
          <div className="bar">
            <div className="progress" style={{ width: `${progress}%` }} />
          </div>
          <span className="total">
            {totalPending}/{totalInitial}
          </span>
        </OrdersBar>
      </Widget>

      <Modal
        title="Detalles de Reservas por Abonar"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <DetailsList>
          {backOrders.map((order: BackOrderItem) => {
            const initialQuantity = Number(order.initialQuantity ?? 0);
            const pendingQuantity = Number(order.pendingQuantity ?? 0);
            const orderProgress =
              initialQuantity > 0
                ? Math.round(
                    ((initialQuantity - pendingQuantity) / initialQuantity) *
                      100,
                  )
                : 0;
            const createdAt =
              order.createdAt instanceof Date ? order.createdAt : null;
            const statusKey =
              typeof order.status === 'string' ? order.status : '';

            return (
              <DetailItem key={order.id}>
                <div className="top-info">
                  <Tooltip title="Cantidad pendiente/inicial">
                    <span className="quantities">
                      {pendingQuantity}/{initialQuantity} unidades
                    </span>
                  </Tooltip>
                </div>
                <div className="date">
                  <FontAwesomeIcon
                    icon={faClock}
                    style={{ marginRight: '8px' }}
                  />
                  {createdAt
                    ? DateTime.fromJSDate(createdAt)
                        .setLocale('es')
                        .toLocaleString(DateTime.DATETIME_MED)
                    : 'Fecha no disponible'}
                  <StatusPill>
                    {statusMapping[statusKey] || statusKey || 'Sin estado'}
                  </StatusPill>
                </div>
                <Progress
                  percent={orderProgress}
                  size="small"
                  strokeColor="#0ea5e9"
                />
              </DetailItem>
            );
          })}
        </DetailsList>
      </Modal>
    </>
  );
};

export default BackOrderList;
