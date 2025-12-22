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
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import {
  closeDeleteModal,
  selectDeleteModalState,
  changeActionType,
} from '../../../../../../../features/productStock/deleteProductStockSlice';
// import { deleteProductStock } from '../../../../../../../services/productStockService';
import { deleteBatch } from '../../../../../../../firebase/warehouse/batchService';
import { deleteProductStock } from '../../../../../../../firebase/warehouse/productStockService';
import { useProductStockData } from '../../../../../../../hooks/useProductStockData';

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

const SelectorOption = styled.div`
  display: flex;
  flex: 1;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  background-color: ${(props) => (props.isSelected ? '#e6f7ff' : 'white')};
  border: 2px solid ${(props) => (props.isSelected ? '#1890ff' : '#d9d9d9')};
  border-radius: 6px;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  transition: all 0.3s;

  &:hover {
    border-color: ${(props) => !props.disabled && '#1890ff'};
  }
`;

const IconWrapper = styled.div`
  font-size: 1.2rem;
  color: ${(props) => (props.isSelected ? '#1890ff' : '#595959')};
`;

const OptionLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${(props) => (props.isSelected ? '#1890ff' : '#595959')};
`;

export const DeleteProductStockModal = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const { isOpen, productStockId, batchId, actionType } = useSelector(
    selectDeleteModalState,
  );
  const { data: stockData, isLoading, error } = useProductStockData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = () => {
    dispatch(closeDeleteModal());
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      setIsSubmitting(true);
      const values = await form.validateFields();

      const movementData = {
        ...values,
        quantity: stockData.quantity,
        ...(actionType === 'batch' ? { batchId } : { productStockId }),
      };

      if (actionType === 'batch') {
        await deleteBatch({
          user,
          batchId,
          movement: movementData,
        });
      } else {
        await deleteProductStock({
          user,
          productStockId,
          movement: movementData,
        });
      }

      message.success(
        `${actionType === 'batch' ? 'Lote' : 'Stock'} eliminado correctamente`,
      );
      handleCancel();
    } catch (error) {
      console.error('Error:', error);
      message.error(
        error.response?.data?.message || 'Error al procesar la solicitud',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionTypeChange = (e) => {
    dispatch(changeActionType(e.target.value));
  };

  const renderStockInfo = () => {
    if (!stockData) return null;

    return (
      <Descriptions
        bordered
        size="small"
        column={1}
        style={{ marginBottom: '0.5rem' }}
        contentStyle={{ padding: '4px 8px' }}
        labelStyle={{ padding: '4px 8px' }}
      >
        {stockData.numberId && (
          <Descriptions.Item label="Número de Lote">
            {stockData.numberId}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Cantidad Total">
          {stockData.quantity} unidades
        </Descriptions.Item>
        {stockData.expirationDate && (
          <Descriptions.Item label="Fecha de Vencimiento">
            {new Date(stockData.expirationDate).toLocaleDateString()}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Ubicaciones">
          {stockData.locations}{' '}
          {stockData.locations > 1 ? 'ubicaciones' : 'ubicación'}
        </Descriptions.Item>
      </Descriptions>
    );
  };

  const renderSelector = () => (
    <SelectorContainer>
      <SelectorOption
        isSelected={actionType === 'productStock'}
        disabled={!productStockId}
        onClick={() =>
          !productStockId ||
          handleActionTypeChange({ target: { value: 'productStock' } })
        }
      >
        <IconWrapper isSelected={actionType === 'productStock'}>
          <FontAwesomeIcon icon={faBox} />
        </IconWrapper>
        <OptionLabel isSelected={actionType === 'productStock'}>
          Stock Individual
        </OptionLabel>
      </SelectorOption>
      <SelectorOption
        isSelected={actionType === 'batch'}
        onClick={() => handleActionTypeChange({ target: { value: 'batch' } })}
      >
        <IconWrapper isSelected={actionType === 'batch'}>
          <FontAwesomeIcon icon={faBoxes} />
        </IconWrapper>
        <OptionLabel isSelected={actionType === 'batch'}>
          Lote Completo
        </OptionLabel>
      </SelectorOption>
    </SelectorContainer>
  );

  const renderContent = () => {
    if (isLoading)
      return <Spin size="large" className="w-full py-4 flex justify-center" />;
    if (error)
      return <Text type="danger">Error cargando la información del stock</Text>;

    return (
      <>
        {renderSelector()}
        {renderStockInfo()}

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
    );
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
      destroyOnHidden
    >
      {renderContent()}
    </Modal>
  );
};
