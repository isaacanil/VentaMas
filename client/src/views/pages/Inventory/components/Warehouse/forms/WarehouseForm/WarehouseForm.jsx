import React, { useState, useEffect } from "react";
import * as antd from "antd";
import styled from "styled-components";

const { Button, Input, InputNumber, Form, Modal } = antd;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const CardTitle = styled.h2`
  margin-left: 10px;
  font-size: 18px;
`;

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

export function WarehouseForm({ visible, onClose, onSave, initialData = null }) {
  // Verificamos si hay datos iniciales para determinar si estamos en modo de creación o actualización
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortName: "",
    number: 0,
    owner: "",
    location: "",
    address: "",
    dimension: {
      length: 0,
      width: 0,
      height: 0,
    },
    capacity: 0,
    businessId: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData); // Rellenar el formulario con los datos iniciales si están presentes
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name.startsWith("dimension.")) {
        const dimensionKey = name.split(".")[1];
        return {
          ...prev,
          dimension: {
            ...prev.dimension,
            [dimensionKey]: parseFloat(value) || 0,
          },
        };
      }
      return {
        ...prev,
        [name]: name === "number" || name === "capacity" ? parseFloat(value) || 0 : value,
      };
    });
  };

  const handleSubmit = () => {
    const warehouseData = {
      ...formData,
      id: initialData ? initialData.id : `warehouse-${Date.now()}`, // Mantener el ID existente si estamos en modo actualización
    };
    onSave(warehouseData); // Usar la prop onSave para guardar los datos
    onClose(); // Cerrar el modal al enviar
  };

  return (
    <Modal
      title={initialData ? "Actualizar Información del Almacén" : "Información del Almacén"}
      open={visible}
      onCancel={onClose}
      footer={null} // Eliminamos el footer predeterminado
    >
      <CardDescription>
        {initialData ? "Actualiza los detalles del almacén" : "Introduce los detalles del nuevo almacén"}
      </CardDescription>
      <FormContainer onFinish={handleSubmit} layout="vertical">
        <Form.Item label="Nombre" required>
          <Input name="name" value={formData.name} onChange={handleChange} />
        </Form.Item>
        <Form.Item label="Nombre Corto" required>
          <Input name="shortName" value={formData.shortName} onChange={handleChange} />
        </Form.Item>
        <Form.Item label="Descripción" required>
          <Input.TextArea name="description" value={formData.description} onChange={handleChange} rows={3} />
        </Form.Item>
        <Form.Item label="Número" required>
          <InputNumber
            name="number"
            min={0}
            value={formData.number}
            onChange={(value) => handleChange({ target: { name: "number", value } })}
          />
        </Form.Item>
        <Form.Item label="Propietario" required>
          <Input name="owner" value={formData.owner} onChange={handleChange} />
        </Form.Item>
        <Form.Item label="Ubicación" required>
          <Input name="location" value={formData.location} onChange={handleChange} />
        </Form.Item>
        <Form.Item label="Dirección" required>
          <Input name="address" value={formData.address} onChange={handleChange} />
        </Form.Item>
        <Form.Item label="Dimensiones (Longitud, Ancho, Altura en m)" required>
          <div style={{ display: "flex", gap: "8px" }}>
            <InputNumber
              name="dimension.length"
              min={0}
              value={formData.dimension.length}
              onChange={(value) => handleChange({ target: { name: "dimension.length", value } })}
            />
            <InputNumber
              name="dimension.width"
              min={0}
              value={formData.dimension.width}
              onChange={(value) => handleChange({ target: { name: "dimension.width", value } })}
            />
            <InputNumber
              name="dimension.height"
              min={0}
              value={formData.dimension.height}
              onChange={(value) => handleChange({ target: { name: "dimension.height", value } })}
            />
          </div>
        </Form.Item>
        <Form.Item label="Capacidad (m³)" required>
          <InputNumber
            name="capacity"
            min={0}
            value={formData.capacity}
            onChange={(value) => handleChange({ target: { name: "capacity", value } })}
          />
        </Form.Item>
        <StyledButton type="primary" htmlType="submit">
          {initialData ? "Actualizar" : "Enviar"}
        </StyledButton>
      </FormContainer>
    </Modal>
  );
}
