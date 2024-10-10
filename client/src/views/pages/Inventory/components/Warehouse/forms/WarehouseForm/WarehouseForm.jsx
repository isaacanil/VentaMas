import React, { useState, useEffect } from "react";
import * as antd from "antd";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { createWarehouse, updateWarehouse } from "../../../../../../../firebase/warehouse/warehouseService";

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

export function WarehouseForm({ isOpen, onClose, initialData = null }) {
  // Verificamos si hay datos iniciales para determinar si estamos en modo de creación o actualización
  const user = useSelector(selectUser);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        dimension: initialData.dimension || { length: 0, width: 0, height: 0 },
        capacity: initialData.capacity || 0,
      }); // Rellenar el formulario con los datos iniciales si están presentes
    } else {
      form.setFieldsValue({
        name: "",
        shortName: "",
        description: "",
        owner: "",
        location: "",
        address: "",
        dimension: { length: 0, width: 0, height: 0 },
        capacity: 0,
      });
    }
  }, [initialData, form]);

  const handleSubmit = async () => {
    try {
      await form.validateFields(); // Validar los campos del formulario
      const data = form.getFieldsValue(); // Obtener los valores del formulario
      setLoading(true);
      if (initialData) {
        await updateWarehouse(user, initialData?.id, data); // Actualizar almacén
      } else {
        await createWarehouse(user, data); // Crear nuevo almacén
      }
      onClose(); // Cerrar el modal al enviar
    } catch (error) {
      antd.message.error("Ocurrió un error al procesar la solicitud.");
      console.error("Ocurrió un error al procesar la solicitud.", error);
    } finally{
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initialData ? "Actualizar Información del Almacén" : "Información del Almacén"}
      open={isOpen}
      onCancel={onClose}
      footer={null} // Eliminamos el footer predeterminado
    >
      <Spin
        size="large"
        spinning={loading}
        tip={initialData ? "Actualizando almacén..." : "Creando almacén..."}
      >
          <CardDescription>
        {initialData ? "Actualiza los detalles del almacén" : "Introduce los detalles del nuevo almacén"}
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
          {initialData ? "Actualizar" : "Enviar"}
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