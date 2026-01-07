// @ts-nocheck
import { Modal, Table, Checkbox, InputNumber, Alert, message } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

const toDateTime = (value) => {
  if (!value) return null;
  if (DateTime.isDateTime(value)) return value;
  if (value instanceof Date) return DateTime.fromJSDate(value);
  if (typeof value === 'number') return DateTime.fromMillis(value);
  if (typeof value === 'string') {
    const iso = DateTime.fromISO(value);
    return iso.isValid ? iso : DateTime.fromJSDate(new Date(value));
  }
  if (typeof value?.toDate === 'function') {
    return DateTime.fromJSDate(value.toDate());
  }
  return null;
};

const BackOrdersModal = ({
  backOrders,
  isVisible,
  onCancel,
  onConfirm,
  initialSelectedBackOrders = [],
  initialPurchaseQuantity = 0,
  productId,
  backOrderAssociationId,
}) => {
  const initialSelectedKey = useMemo(
    () =>
      initialSelectedBackOrders
        .map((order) => `${order?.id ?? ''}:${order?.quantity ?? ''}`)
        .join('|'),
    [initialSelectedBackOrders],
  );

  const openTrigger = `${isVisible}-${initialPurchaseQuantity}-${initialSelectedKey}`;
  const [{ trigger, selectedBackOrders, purchaseQuantity: purchaseQuantityState }, setLocalState] =
    useState(() => ({
      trigger: openTrigger,
      selectedBackOrders: initialSelectedBackOrders,
      purchaseQuantity: initialPurchaseQuantity,
    }));

  const localSelectedBackOrders =
    trigger === openTrigger ? selectedBackOrders : initialSelectedBackOrders;
  const purchaseQuantity =
    trigger === openTrigger ? purchaseQuantityState : initialPurchaseQuantity;

  const setLocalSelectedBackOrders = useCallback(
    (updater) => {
      setLocalState((prev) => {
        const currentSelected =
          prev.trigger === openTrigger
            ? prev.selectedBackOrders
            : initialSelectedBackOrders;
        const currentQty =
          prev.trigger === openTrigger
            ? prev.purchaseQuantity
            : initialPurchaseQuantity;
        const nextSelected =
          typeof updater === 'function' ? updater(currentSelected) : updater;
        return {
          trigger: openTrigger,
          selectedBackOrders: nextSelected,
          purchaseQuantity: currentQty,
        };
      });
    },
    [initialPurchaseQuantity, initialSelectedBackOrders, openTrigger],
  );

  const setPurchaseQuantity = useCallback(
    (updater) => {
      setLocalState((prev) => {
        const currentSelected =
          prev.trigger === openTrigger
            ? prev.selectedBackOrders
            : initialSelectedBackOrders;
        const currentQty =
          prev.trigger === openTrigger
            ? prev.purchaseQuantity
            : initialPurchaseQuantity;
        const nextQty = typeof updater === 'function' ? updater(currentQty) : updater;
        return {
          trigger: openTrigger,
          selectedBackOrders: currentSelected,
          purchaseQuantity: nextQty,
        };
      });
    },
    [initialPurchaseQuantity, initialSelectedBackOrders, openTrigger],
  );
  const totalBackordersQuantity = localSelectedBackOrders.reduce(
    (sum, order) => sum + order.quantity,
    0,
  );
  const remainingQuantity = Math.max(
    0,
    purchaseQuantity - totalBackordersQuantity,
  );

  const handleBackOrderSelect = (e, record) => {
    if (e.target.checked) {
      setLocalSelectedBackOrders((prev) => [
        ...prev,
        {
          id: record.id,
          quantity: record.pendingQuantity,
          productId: record.productId,
          orderId: record.orderId || record.purchaseId,
        },
      ]);
    } else {
      setLocalSelectedBackOrders((prev) =>
        prev.filter((bo) => bo.id !== record.id),
      );
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const availableBackOrders = backOrders
        .filter((record) => {
          const recordSourceId = record.orderId || record.purchaseId;
          return !(
            record.status === 'reserved' &&
            (!backOrderAssociationId ||
              recordSourceId !== backOrderAssociationId)
          );
        })
        .map((record) => ({
          id: record.id,
          quantity: record.pendingQuantity,
          productId: record.productId,
          orderId: record.orderId || record.purchaseId,
        }));
      setLocalSelectedBackOrders(availableBackOrders);
      // Auto-ajustar cantidad mínima cuando se seleccionan todos
      const totalQuantity = availableBackOrders.reduce(
        (sum, bo) => sum + bo.quantity,
        0,
      );
      if (purchaseQuantity < totalQuantity) {
        setPurchaseQuantity(totalQuantity);
      }
    } else {
      setLocalSelectedBackOrders([]);
    }
  };

  const getSelectAllState = () => {
    const availableBackOrders = backOrders.filter((record) => {
      const recordSourceId = record.orderId || record.purchaseId;
      return !(
        record.status === 'reserved' &&
        (!backOrderAssociationId || recordSourceId !== backOrderAssociationId)
      );
    });

    if (availableBackOrders.length === 0) return false;

    const selectedCount = localSelectedBackOrders.length;
    if (selectedCount === 0) return false;
    if (selectedCount === availableBackOrders.length) return true;
    return 'indeterminate';
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={getSelectAllState() === true}
          indeterminate={getSelectAllState() === 'indeterminate'}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Seleccionar
        </Checkbox>
      ),
      dataIndex: 'id',
      width: 120,
      render: (_, record) => {
        const recordSourceId = record.orderId || record.purchaseId;
        const isDisabled =
          record.status === 'reserved' &&
          (!backOrderAssociationId ||
            recordSourceId !== backOrderAssociationId);

        return (
          <Checkbox
            checked={localSelectedBackOrders.some((bo) => bo.id === record.id)}
            onChange={(e) => handleBackOrderSelect(e, record)}
            disabled={isDisabled}
          />
        );
      },
    },
    {
      title: 'Cantidad',
      dataIndex: 'pendingQuantity',
      width: 100,
      render: (qty) => <span style={{ fontWeight: 500 }}>{qty}</span>,
    },
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      width: 120,
      render: (date) => {
        const parsed = toDateTime(date);
        return parsed ? parsed.toFormat('dd/MM/yy') : '—';
      },
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      width: 80,
      render: (status, record) => {
        const isReserved =
          record.status === 'reserved' &&
          record.orderId !== backOrderAssociationId;
        return isReserved ? (
          <span style={{ color: '#ff4d4f', fontSize: '12px' }}>Reservado</span>
        ) : (
          <span style={{ color: '#52c41a', fontSize: '12px' }}>Disponible</span>
        );
      },
    },
  ];

  const handleOk = () => {
    if (!productId) {
      message.error('No se encontró productId');
      return;
    }
    if (
      localSelectedBackOrders.length > 0 &&
      purchaseQuantity < totalBackordersQuantity
    ) {
      message.error(
        'La cantidad a comprar debe ser mayor o igual a la cantidad total de backorders seleccionados',
      );
      return;
    }
    onConfirm({
      id: productId,
      selectedBackOrders: localSelectedBackOrders,
      purchaseQuantity,
    });
  };

  return (
    <Modal
      title="Backorders Pendientes"
      open={isVisible}
      onOk={handleOk}
      onCancel={onCancel}
      width={800}
      style={{ top: 10 }}
      okText="Confirmar"
      cancelText="Cancelar"
    >
      <ModalContent>
        <CompactStatsSection>
          <QuantityInputSection>
            <label>Cantidad a comprar:</label>
            <InputNumber
              value={purchaseQuantity}
              onChange={(value) => setPurchaseQuantity(value || 0)}
              min={totalBackordersQuantity}
              style={{ width: 120 }}
              placeholder={totalBackordersQuantity}
            />
          </QuantityInputSection>
          <QuickStats>
            <span>
              {localSelectedBackOrders.length} backorders seleccionados
            </span>
            <span>{totalBackordersQuantity} unidades</span>
            {remainingQuantity > 0 && (
              <span style={{ color: '#52c41a' }}>
                +{remainingQuantity} extra
              </span>
            )}
          </QuickStats>
        </CompactStatsSection>

        {localSelectedBackOrders.length > 0 &&
          purchaseQuantity < totalBackordersQuantity && (
            <Alert
              type="warning"
              message="La cantidad a comprar debe ser mayor o igual a la cantidad total de backorders seleccionados"
              style={{ marginBottom: 16 }}
            />
          )}

        <SectionTitle>Selecciona los pedidos pendientes a cubrir:</SectionTitle>
        <Table
          dataSource={backOrders}
          columns={columns}
          size="small"
          pagination={false}
          rowKey="id"
          scroll={{ y: 300 }}
        />
      </ModalContent>
    </Modal>
  );
};

export default BackOrdersModal;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CompactStatsSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
`;

const QuantityInputSection = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  label {
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }
`;

const QuickStats = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;

  span {
    font-size: 13px;
    color: #666;
    white-space: nowrap;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;
