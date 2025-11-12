import { faBoxes, faClock, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Spin, Modal, Button, Progress, Tooltip } from 'antd';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import styled from 'styled-components';

import { useBackOrdersByProduct } from '../../../../../../../../firebase/warehouse/backOrderService';




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
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-size: 0.9rem;
    
    .icon {
      color: #94a3b8;
    }
  }
`;

const OrdersBar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  
  .bar {
    flex: 1;
    height: 24px;
    background: #f1f5f9;
    border-radius: 12px;
    display: flex;
    overflow: hidden;
  }

  .progress {
    height: 100%;
    background: #0ea5e9;
    transition: width 0.3s ease;
  }
  
  .total {
    min-width: 70px;
    text-align: right;
    font-weight: 500;
    color: #0f172a;
    font-size: 0.9rem;
  }
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DetailItem = styled.div`
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  position: relative;

  .date {
    color: #64748b;
    font-size: 0.85rem;
    margin-bottom: 12px;
  }

  .top-info {
    position: absolute;
    top: 12px;
    right: 12px;
  }

  .quantities {
    color: #0f172a;
    font-size: 0.9rem;
  }
`;

const StatusPill = styled.span`
  background: #e0f7fa;
  color: #00695c;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-left: 8px;
`;

const BackOrderList = ({ productId }) => {
  // Agregar mapeo de estados para la interfaz en español
  const statusMapping = {
    pending: "Pendiente",
    reserved: "Reservado"
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { backOrders, loading, error } = useBackOrdersByProduct( productId);

  if (loading) return <Spin size="small" />;
  if (error || !backOrders?.length) return null;

  const totalInitial = backOrders.reduce((sum, order) => sum + order.initialQuantity, 0);
  const totalPending = backOrders.reduce((sum, order) => sum + order.pendingQuantity, 0);
  const progress = Math.round(((totalInitial - totalPending) / totalInitial) * 100);

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
              gap: '4px'
            }}
          >
            Ver detalles
            <FontAwesomeIcon icon={faChevronRight} />
          </Button>
        </div>
        <OrdersBar>
          <div className="bar">
            <div 
              className="progress" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <span className="total">{totalPending}/{totalInitial}</span>
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
          {backOrders.map(order => {
            const orderProgress = Math.round(((order.initialQuantity - order.pendingQuantity) / order.initialQuantity) * 100);
            return (
              <DetailItem key={order.id}>
                <div className="top-info">
                  <Tooltip title="Cantidad pendiente/inicial">
                    <span className="quantities">{order.pendingQuantity}/{order.initialQuantity} unidades</span>
                  </Tooltip>
                </div>
                <div className="date">
                  <FontAwesomeIcon icon={faClock} style={{ marginRight: '8px' }} />
                  {DateTime.fromJSDate(order.createdAt).setLocale('es').toLocaleString(DateTime.DATETIME_MED)}
                  <StatusPill>{statusMapping[order.status] || order.status}</StatusPill>
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
