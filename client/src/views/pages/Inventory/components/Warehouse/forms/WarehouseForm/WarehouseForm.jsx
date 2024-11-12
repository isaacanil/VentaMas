import React, { useEffect } from "react";
import * as antd from "antd";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { createWarehouse, updateWarehouse } from "../../../../../../../firebase/warehouse/warehouseService";
import { 
    selectWarehouseModalState, 
    closeWarehouseForm, 
    setWarehouseLoading, 
    setWarehouseError 
} from "../../../../../../../features/warehouse/warehouseModalSlice";

const { Button, Input, InputNumber, Form, Spin, Modal } = antd;

const CardDescription = styled.p`
  color: #888;
  margin-bottom: 20px;
`;

const FormContainer = styled(Form)`
  display: flex;
  flex-direction: column;
`;

const StyledButton = styled(Button)`
  width: 100%;
  background-color: #1890ff;
  color: white;
  &:hover {
    background-color: #40a9ff;
  }
`;

export function WarehouseForm() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isOpen, formData, loading, error } = useSelector(selectWarehouseModalState);
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
      await form.validateFields(); // Validate form fields
      const data = form.getFieldsValue(); // Get form values
      dispatch(setWarehouseLoading(true));
      if (formData && formData.id) {
        await updateWarehouse(user, formData.id, data); // Update warehouse
      } else {
        await createWarehouse(user, data); // Create new warehouse
      }
      dispatch(closeWarehouseForm()); // Close the modal after submission
      antd.message.success(`Almacén ${formData ? "actualizado" : "creado"} correctamente`);
    } catch (error) {
      antd.message.error("Ocurrió un error al procesar la solicitud.");
      dispatch(setWarehouseError(error.message));
      console.error("Ocurrió un error al procesar la solicitud.", error);
    } finally {
      dispatch(setWarehouseLoading(false));
    }
  };

  return (
    <Modal
      title={formData && formData.id ? "Actualizar Información del Almacén" : "Información del Almacén"}
      open={isOpen}
      onCancel={() => dispatch(closeWarehouseForm())}
      footer={null} // Remove default footer
    >
      <Spin
        size="large"
        spinning={loading}
        tip={formData && formData.id ? "Actualizando almacén..." : "Creando almacén..."}
      >
        <CardDescription>
          {formData && formData.id ? "Actualiza los detalles del almacén" : "Introduce los detalles del nuevo almacén"}
        </CardDescription>
        <FormContainer form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label="Nombre" name="name" rules={[{ required: true, message: "Por favor ingresa el nombre" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Nombre Corto" rules={[{required: true, message: "Por favor ingresa el nombre corto"}]} name="shortName">
            <Input />
          </Form.Item>
          <Form.Item label="Descripción" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Propietario" name="owner">
            <Input />
          </Form.Item>
          <Form.Item label="Ubicación" name="location" rules={[{ required: true, message: "Por favor ingresa la ubicación" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Dirección" name="address">
            <Input />
          </Form.Item>

          <DimensionInputGroup>
            <Form.Item label={'Longitud'} name={['dimension', 'length']} >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="Longitud" />
            </Form.Item>
            <Form.Item label={'Ancho'} name={['dimension', 'width']}>
              <InputNumber style={{ width: '100%' }} min={0} placeholder="Ancho" />
            </Form.Item>
            <Form.Item label={'Altura'} name={['dimension', 'height']} >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="Altura" />
            </Form.Item>
          </DimensionInputGroup>

          <Form.Item label="Capacidad (m³)" name="capacity">
            <InputNumber min={0} />
          </Form.Item>
          <StyledButton type="primary" htmlType="submit">
            {formData && formData.id ? "Actualizar" : "Enviar"}
          </StyledButton>
        </FormContainer>
      </Spin>
    </Modal>
  );
}

const DimensionInputGroup = styled.div`
  display: grid;
  gap: 0.6em;
  grid-template-columns: repeat(3, 1fr);
  input[type="number"] {
    width: 100% !important;
    max-width: none !important;
  }
`;