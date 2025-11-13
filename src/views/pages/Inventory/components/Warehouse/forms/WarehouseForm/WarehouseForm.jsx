import * as antd from 'antd';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import {
  selectWarehouseModalState,
  closeWarehouseForm,
  setWarehouseLoading,
  setWarehouseError,
} from '../../../../../../../features/warehouse/warehouseModalSlice';
import {
  createWarehouse,
  updateWarehouse,
} from '../../../../../../../firebase/warehouse/warehouseService';

const { Button, Input, InputNumber, Form, Spin, Modal } = antd;

const CardDescription = styled.p`
  margin-bottom: 20px;
  color: #888;
`;

const FormContainer = styled(Form)`
  display: flex;
  flex-direction: column;
`;

const StyledButton = styled(Button)`
  width: 100%;
  color: white;
  background-color: #1890ff;

    &:hover {
    background-color: #40a9ff;
  }
`;

export function WarehouseForm() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isOpen, formData, loading } = useSelector(selectWarehouseModalState);
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (formData) {
        form.setFieldsValue({
          ...formData,
          dimension: formData.dimension || { length: 0, width: 0, height: 0 },
          capacity: formData.capacity || 0,
        }); // Populate the form with initial data if present
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, formData, form]);

  const handleSubmit = async () => {
    try {
      dispatch(setWarehouseError(null));
      await form.validateFields(); // Validate form fields
      let data = form.getFieldsValue(); // Get form values

      // Sanitize the data before sending to Firebase
      data = {
        name: data.name || '',
        shortName: data.shortName || '',
        description: data.description || '',
        owner: data.owner || '',
        location: data.location || '',
        address: data.address || '',
        dimension: {
          length: data.dimension?.length || 0,
          width: data.dimension?.width || 0,
          height: data.dimension?.height || 0,
        },
        capacity: data.capacity || 0,
      };

      dispatch(setWarehouseLoading(true));
      if (formData && formData.id) {
        await updateWarehouse(user, formData.id, data); // Update warehouse
      } else {
        await createWarehouse(user, data); // Create new warehouse
      }
      handleClose(); // Close the modal after submission
      antd.message.success(
        `Almacén ${formData ? 'actualizado' : 'creado'} correctamente`,
      );
    } catch (error) {
      antd.message.error('Ocurrió un error al procesar la solicitud.');
      dispatch(setWarehouseError(error.message));
      console.error('Ocurrió un error al procesar la solicitud.', error);
    } finally {
      dispatch(setWarehouseLoading(false));
    }
  };

  const handleClose = () => {
    dispatch(closeWarehouseForm());
    form.resetFields();
  };

  return (
    <Modal
      title={
        formData && formData.id
          ? 'Actualizar Información del Almacén'
          : 'Información del Almacén'
      }
      open={isOpen}
      onCancel={handleClose}
      destroyOnHidden
      footer={null} // Remove default footer
    >
      <Spin
        size="large"
        spinning={loading}
        tip={
          formData && formData.id
            ? 'Actualizando almacén...'
            : 'Creando almacén...'
        }
      >
        <CardDescription>
          {formData && formData.id
            ? 'Actualiza los detalles del almacén'
            : 'Introduce los detalles del nuevo almacén'}
        </CardDescription>
        <FormContainer form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Nombre"
            name="name"
            rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Nombre Corto"
            rules={[
              { required: true, message: 'Por favor ingresa el nombre corto' },
            ]}
            name="shortName"
          >
            <Input />
          </Form.Item>
          <Form.Item label="Descripción" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Propietario" name="owner">
            <Input />
          </Form.Item>
          <Form.Item
            label="Ubicación"
            name="location"
            rules={[
              { required: true, message: 'Por favor ingresa la ubicación' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Dirección" name="address">
            <Input />
          </Form.Item>

          <DimensionInputGroup>
            <Form.Item label={'Longitud'} name={['dimension', 'length']}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Longitud"
              />
            </Form.Item>
            <Form.Item label={'Ancho'} name={['dimension', 'width']}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Ancho"
              />
            </Form.Item>
            <Form.Item label={'Altura'} name={['dimension', 'height']}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Altura"
              />
            </Form.Item>
          </DimensionInputGroup>

          <Form.Item label="Capacidad (m³)" name="capacity">
            <InputNumber min={0} />
          </Form.Item>
          <StyledButton type="primary" htmlType="submit">
            {formData && formData.id ? 'Actualizar' : 'Enviar'}
          </StyledButton>
        </FormContainer>
      </Spin>
    </Modal>
  );
}

const DimensionInputGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6em;

  input[type='number'] {
    width: 100% !important;
    max-width: none !important;
  }
`;
