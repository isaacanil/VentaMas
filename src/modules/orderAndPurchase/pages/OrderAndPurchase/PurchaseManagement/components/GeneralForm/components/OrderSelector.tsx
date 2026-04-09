import { LoadingOutlined, PlusOutlined, CloseOutlined } from '@/constants/icons/antd';
import { Form, Input, Drawer, message, Button, Space, Empty } from 'antd';
import type { InputRef } from 'antd';
import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { getOrderData } from '@/features/purchase/addPurchaseSlice';
import { formatDate } from '@/utils/date/dateUtils';
import { formatPrice } from '@/utils/format';
import { calculateOrderTotals } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/OrderManagement/utils/orderCalculationsUtil';
import { normalizeText } from '@/utils/text';


const Wrapper = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 8px;
  height: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 0 1em;

  .search-container {
    flex: 1;
  }
`;

const OrdersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  align-content: start;
  align-items: start;
  padding: 0 1em;
  overflow-y: auto;

  .empty-container {
    display: flex;
    grid-column: 1 / -1;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 200px;

    .ant-empty {
      .ant-empty-description {
        font-size: 14px;
        color: #8c8c8c;
      }
    }
  }
`;

const OrderCard = styled.div<{ $isSelected?: boolean }>`
  padding: 12px;
  cursor: pointer;
  background-color: ${(props) => (props.$isSelected ? '#e6f7ff' : 'white')};
  border: 1px solid ${(props) => (props.$isSelected ? '#1890ff' : '#e8e8e8')};
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  }

  .order-number {
    font-size: 14px;
    font-weight: 500;
    color: #262626;
  }

  .order-date {
    font-size: 12px;
    color: #8c8c8c;
  }

  .order-total {
    margin-top: 4px;
    font-size: 14px;
    color: #262626;
  }
`;

const OrderInfo = styled.div`
  padding: 0.4em 0.6em 0.6em;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #40a9ff;
  }

  &.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    color: #8c8c8c;
  }

  .order-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .order-name {
    font-size: 16px;
    font-weight: 500;
    color: #262626;
  }

  .order-details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.3em;
    font-size: 14px;
    line-height: 1.1pc;
    color: #595959;
  }

  .detail-item {
    gap: 4px;
  }

  .detail-label {
    font-size: 12px;
    color: #40a9ff;
  }
`;

interface OrderListItem {
  id?: string;
  numberId?: number | string;
  dates?: { createdAt?: number | string | Date | null };
  createdAt?: number | string | Date | null;
  total?: number;
  replenishments?: any[];
}

interface OrderSelectorProps {
  orders?: OrderListItem[];
  orderLoading?: boolean;
}

const EMPTY_ORDERS: OrderListItem[] = [];

const OrderSelector = ({
  orders = EMPTY_ORDERS,
  orderLoading,
}: OrderSelectorProps) => {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(
    null,
  );
  const searchInputRef = useRef<InputRef | null>(null);

  const getEffectiveTotal = (order?: OrderListItem | null) => {
    if (!order) return 0;
    if (typeof order.total === 'number' && order.total > 0) return order.total;
    if (order.replenishments && Array.isArray(order.replenishments)) {
      const { grandTotal } = calculateOrderTotals(order.replenishments);
      return grandTotal;
    }
    return order.total ?? 0;
  };

  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus?.();
      }, 100);
    }
  }, [visible]);

  const filteredOrders = search
    ? orders.filter((order) => {
        const orderNumber = order.numberId ?? '';
        const createdAt =
          order.dates?.createdAt ?? order.dates?.createdAt ?? null;
        const createdAtText = createdAt ? formatDate(createdAt as number) : '';
        return (
          normalizeText(String(orderNumber)).includes(normalizeText(search)) ||
          normalizeText(createdAtText).includes(normalizeText(search))
        );
      })
    : orders;

  const handleOrderSelect = (order: OrderListItem) => {
    setSelectedOrder(order);
    dispatch(getOrderData(order));
    setVisible(false);
    setSearch('');
    message.success('Pedido seleccionado');
  };

  const handleClear = () => {
    setSelectedOrder(null);
    dispatch(getOrderData(null));
    message.info('Pedido removido');
  };

  return (
    <div>
      <Form.Item
        label="Pedido"
        rules={[{ required: true, message: 'Por favor selecciona un pedido' }]}
      >
        <OrderInfo
          className={!selectedOrder ? 'empty' : ''}
          onClick={() => setVisible(true)}
        >
          {!selectedOrder ? (
            <div>
              {orderLoading ? (
                <LoadingOutlined style={{ marginRight: 8 }} />
              ) : (
                <PlusOutlined style={{ marginRight: 8 }} />
              )}
              Seleccionar Pedido{' '}
              {orders.length > 0 ? `(${orders.length} disponibles)` : ''}
            </div>
          ) : (
            <>
              <div className="order-header">
                <span className="order-name">Pedido #{selectedOrder.numberId}</span>
                <CloseOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  style={{ cursor: 'pointer', color: '#8c8c8c' }}
                />
              </div>
              <div className="order-details">
                <div className="detail-item">
                  <div className="detail-label">Fecha:</div>
                  {formatDate(
                    selectedOrder?.dates?.createdAt ??
                      selectedOrder?.createdAt ??
                      0,
                  )}
                </div>
                <div className="detail-item">
                  <div className="detail-label">Total:</div>
                  {formatPrice(getEffectiveTotal(selectedOrder))}
                </div>
              </div>
            </>
          )}
        </OrderInfo>
      </Form.Item>
      <Drawer
        title="Lista de Pedidos"
        placement="bottom"
        onClose={() => setVisible(false)}
        open={visible}
        height={'80%'}
        styles={{
          body: { padding: '1em' },
        }}
      >
        <Wrapper>
          <Header>
            <div className="search-container">
              <Input
                ref={searchInputRef}
                placeholder="Buscar pedidos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Header>
          <OrdersContainer>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  onClick={() => handleOrderSelect(order)}
                  $isSelected={selectedOrder?.id === order.id}
                >
                  <div className="order-number">Pedido #{order.numberId}</div>
                  <div className="order-date">
                    {formatDate(
                      order.dates?.createdAt ?? order.createdAt ?? '',
                    )}
                  </div>
                  <div className="order-total">
                    Total: {formatPrice(getEffectiveTotal(order))}
                  </div>
                </OrderCard>
              ))
            ) : (
              <div className="empty-container">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    search
                      ? 'No se encontraron pedidos con los criterios de búsqueda'
                      : 'No hay pedidos pendientes para este proveedor'
                  }
                />
              </div>
            )}
          </OrdersContainer>
        </Wrapper>
      </Drawer>
    </div>
  );
};

export default OrderSelector;
