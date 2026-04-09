import { faBox, faBoxes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Modal,
  Input,
  Select,
  Form,
  Typography,
  Descriptions,
  Spin,
  message,
} from 'antd';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import {
  closeDeleteModal,
  selectDeleteModalState,
  changeActionType,
} from '@/features/productStock/deleteProductStockSlice';
import { deleteBatch } from '@/firebase/warehouse/batchService';
import { deleteProductStock } from '@/firebase/warehouse/productStockService';
import { MovementReason } from '@/models/Warehouse/Movement';
import { useProductStockData } from '@/hooks/useProductStockData';
import type { InventoryUser } from '@/utils/inventory/types';

const { TextArea } = Input;
const { Text } = Typography;

const deleteReasons = [
  { value: 'expired', label: 'Vencimiento' },
  { value: 'damaged', label: 'Dañado' },
  { value: 'lost', label: 'Pérdida' },
  { value: 'other', label: 'Otro' },
];

const SelectorContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const SelectorOption = styled.div<{
  $disabled?: boolean;
  $isSelected?: boolean;
}>`
  display: flex;
  flex: 1;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  cursor: ${({ $disabled }: { $disabled?: boolean }) =>
    $disabled ? 'not-allowed' : 'pointer'};
  background-color: ${({ $isSelected }: { $isSelected?: boolean }) =>
    $isSelected ? '#e6f7ff' : 'white'};
  border: 2px solid
    ${({ $isSelected }: { $isSelected?: boolean }) =>
      $isSelected ? '#1890ff' : '#d9d9d9'};
  border-radius: 6px;
  opacity: ${({ $disabled }: { $disabled?: boolean }) => ($disabled ? 0.5 : 1)};
  transition: all 0.3s;

  &:hover {
    border-color: ${({ $disabled }: { $disabled?: boolean }) =>
      !$disabled ? '#1890ff' : undefined};
  }
`;

const IconWrapper = styled.div<{ $isSelected?: boolean }>`
  font-size: 1.2rem;
  color: ${({ $isSelected }: { $isSelected?: boolean }) =>
    $isSelected ? '#1890ff' : '#595959'};
`;

const OptionLabel = styled.span<{ $isSelected?: boolean }>`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ $isSelected }: { $isSelected?: boolean }) =>
    $isSelected ? '#1890ff' : '#595959'};
`;

type DeleteActionType = 'batch' | 'productStock';

type DeleteFormValues = {
  reason: string;
  notes?: string;
};

interface StockInfoSummaryProps {
  stockData: unknown;
}

interface DeleteActionSelectorProps {
  actionType: DeleteActionType;
  onActionTypeChange: (value: DeleteActionType) => void;
  productStockId: string | null | undefined;
}

const formatExpirationDate = (value: unknown): string | null => {
  if (!value) return null;
  return formatLocaleDate(value) || null;
};

const StockInfoSummary = ({ stockData }: StockInfoSummaryProps) => {
  const expirationLabel = formatExpirationDate(
    (stockData as any).expirationDate,
  );

  return (
    <Descriptions
      bordered
      size="small"
      column={1}
      style={{ marginBottom: '0.5rem' }}
      contentStyle={{ padding: '4px 8px' }}
      labelStyle={{ padding: '4px 8px' }}
    >
      {(stockData as any).numberId && (
        <Descriptions.Item label="Número de Lote">
          {String((stockData as any).numberId ?? '')}
        </Descriptions.Item>
      )}
      <Descriptions.Item label="Cantidad Total">
        {(stockData as any).quantity} unidades
      </Descriptions.Item>
      {expirationLabel && (
        <Descriptions.Item label="Fecha de Vencimiento">
          {expirationLabel}
        </Descriptions.Item>
      )}
      <Descriptions.Item label="Ubicaciones">
        {(stockData as any).locations}{' '}
        {(stockData as any).locations > 1 ? 'ubicaciones' : 'ubicación'}
      </Descriptions.Item>
    </Descriptions>
  );
};

const DeleteActionSelector = ({
  actionType,
  onActionTypeChange,
  productStockId,
}: DeleteActionSelectorProps) => (
  <SelectorContainer>
    <SelectorOption
      $isSelected={actionType === 'productStock'}
      $disabled={!productStockId}
      onClick={() => productStockId && onActionTypeChange('productStock')}
    >
      <IconWrapper $isSelected={actionType === 'productStock'}>
        <FontAwesomeIcon icon={faBox} />
      </IconWrapper>
      <OptionLabel $isSelected={actionType === 'productStock'}>
        Stock Individual
      </OptionLabel>
    </SelectorOption>
    <SelectorOption
      $isSelected={actionType === 'batch'}
      onClick={() => onActionTypeChange('batch')}
    >
      <IconWrapper $isSelected={actionType === 'batch'}>
        <FontAwesomeIcon icon={faBoxes} />
      </IconWrapper>
      <OptionLabel $isSelected={actionType === 'batch'}>
        Lote Completo
      </OptionLabel>
    </SelectorOption>
  </SelectorContainer>
);

const submitDeleteRequest = ({
  isBatchDelete,
  batchDeleteRequest,
  productStockDeleteRequest,
}: {
  isBatchDelete: boolean;
  batchDeleteRequest: Parameters<typeof deleteBatch>[0];
  productStockDeleteRequest: Parameters<typeof deleteProductStock>[0];
}) =>
  isBatchDelete
    ? deleteBatch(batchDeleteRequest)
    : deleteProductStock(productStockDeleteRequest);

export const DeleteProductStockModal = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm<DeleteFormValues>();
  const user = useSelector(selectUser) as InventoryUser | null;
  const { isOpen, productStockId, batchId, actionType } = useSelector(
    selectDeleteModalState,
  );
  const { data: stockData, isLoading, error } = useProductStockData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = () => {
    dispatch(closeDeleteModal());
    form.resetFields();
  };

  const handleActionTypeChange = (value: DeleteActionType) => {
    dispatch(changeActionType(value));
  };

  const resolveMovementReason = (reason: string): MovementReason => {
    switch (reason) {
      case 'expired':
        return MovementReason.Expired;
      case 'damaged':
        return MovementReason.Damaged;
      case 'lost':
        return MovementReason.Lost;
      default:
        return MovementReason.Adjustment;
    }
  };

  const handleOk = async () => {
    if (!stockData) {
      message.error('No se pudo cargar la información del stock.');
      return;
    }

    if (!user?.businessID) {
      message.error('No se pudo determinar el negocio.');
      return;
    }

    if (actionType === 'batch' && !batchId) {
      message.error('No se pudo determinar el lote.');
      return;
    }

    if (actionType === 'productStock' && !productStockId) {
      message.error('No se pudo determinar el stock a eliminar.');
      return;
    }

    const isBatchDelete = actionType === 'batch';
    const movementTarget = isBatchDelete ? { batchId } : { productStockId };
    const successMessage = `${
      isBatchDelete ? 'Lote' : 'Stock'
    } eliminado correctamente`;

    setIsSubmitting(true);
    try {
      const values = await form.validateFields();
      const movementData = {
        ...values,
        reason: resolveMovementReason(values.reason),
        quantity: (stockData as any).quantity,
        ...movementTarget,
      };
      const batchDeleteRequest = {
        user,
        batchId,
        movement: movementData as any,
      };
      const productStockDeleteRequest = {
        user,
        productStockId,
        movement: movementData as any,
      };
      await submitDeleteRequest({
        isBatchDelete,
        batchDeleteRequest,
        productStockDeleteRequest,
      });
      message.success(successMessage);
      handleCancel();
    } catch (error) {
      const maybeResponseMessage =
        typeof error === 'object' &&
        error &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === 'string'
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      const fallbackMessage =
        error instanceof Error
          ? error.message
          : 'Error al procesar la solicitud';
      message.error(
        ((maybeResponseMessage as string) || fallbackMessage) as any,
      );
      console.error('Error:', error);
    }
    setIsSubmitting(false);
  };

  return (
    <Modal
      title={`Eliminar ${actionType === 'batch' ? 'Lote' : 'Stock'}`}
      open={isOpen}
      onCancel={handleCancel}
      onOk={handleOk}
      style={{ top: '20px' }}
      okButtonProps={{ loading: isSubmitting }}
      cancelButtonProps={{ disabled: isSubmitting }}
      destroyOnClose
    >
      {isLoading ? (
        <Spin size="large" className="w-full py-4 flex justify-center" />
      ) : error ? (
        <Text type="danger">Error cargando la información del stock</Text>
      ) : (
        <>
          <DeleteActionSelector
            actionType={actionType}
            onActionTypeChange={handleActionTypeChange}
            productStockId={productStockId}
          />
          {stockData ? <StockInfoSummary stockData={stockData} /> : null}

          <Form form={form} layout="vertical" style={{ gap: '0.5rem' }}>
            <Form.Item
              name="reason"
              label="Motivo"
              style={{ marginBottom: '8px' }}
              rules={[
                { required: true, message: 'Por favor seleccione un motivo' },
              ]}
            >
              <Select options={deleteReasons} />
            </Form.Item>

            <Form.Item name="notes" label="Notas" style={{ marginBottom: '8px' }}>
              <TextArea rows={3} />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};
