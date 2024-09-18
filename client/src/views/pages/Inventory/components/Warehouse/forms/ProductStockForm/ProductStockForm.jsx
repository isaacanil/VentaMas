import React, { useState, useEffect } from "react";
import * as antd from "antd";
import styled from "styled-components";
import { createProductStock, updateProductStock } from "../../../../../../../firebase/warehouse/ProductStockService";

const { Button, Input, InputNumber, Form, Modal, Select, message, Spin } = antd;
const { Option } = Select;

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

export function ProductStockForm({ isOpen, onClose, initialData = null, locationType = "Warehouse" }) {
  const [loading, setLoading] = useState(false); // Indicador de carga
  const [formData, setFormData] = useState({
    id: "", // Autogenerado, no necesario en el formulario
    batchId: "",
    locationType, // Tipo de ubicación
    locationId: "", // Referencia a la ubicación
    productId: "",
    stock: 0, // Cantidad de stock
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData); // Rellenar el formulario con datos iniciales si están presentes
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "stock" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true); // Activar indicador de carga
    try {
      if (initialData) {
        await updateProductStock(formData); // Actualizar producto en stock
      } else {
        await createProductStock(formData); // Crear nuevo producto en stock
      }
      message.success(`Producto ${initialData ? 'actualizado' : 'creado'} exitosamente.`);
      onClose(); // Cerrar el modal después de enviar
    } catch (error) {
      message.error("Ocurrió un error al procesar la solicitud.");
    } finally {
      setLoading(false); // Desactivar indicador de carga
    }
  };

  return (
    <Modal
      title={initialData ? "Actualizar Producto en Stock" : "Agregar Producto en Stock"}
      open={isOpen}
      onCancel={onClose}
      footer={null}
    >
      <Spin spinning={loading}>
        <FormContainer onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="ID de Lote"
            name="batchId"
            rules={[{ required: true, message: "Por favor, ingrese el ID del lote" }]}
          >
            <Input name="batchId" value={formData.batchId} onChange={handleChange} />
          </Form.Item>
          <Form.Item
            label="Tipo de Ubicación"
          >
            <Input value={locationType} readOnly />
          </Form.Item>
          <Form.Item
            label="ID de Ubicación"
            name="locationId"
            rules={[{ required: true, message: "Por favor, ingrese el ID de la ubicación" }]}
          >
            <Input name="locationId" value={formData.locationId} onChange={handleChange} />
          </Form.Item>
          <Form.Item
            label="ID de Producto"
            name="productId"
            rules={[{ required: true, message: "Por favor, ingrese el ID del producto" }]}
          >
            <Input name="productId" value={formData.productId} onChange={handleChange} />
          </Form.Item>
          <Form.Item
            label="Cantidad de Stock"
            name="stock"
            rules={[{ required: true, message: "Por favor, ingrese la cantidad de stock" }]}
          >
            <InputNumber
              name="stock"
              min={0}
              value={formData.stock}
              onChange={(value) => handleChange({ target: { name: "stock", value } })}
            />
          </Form.Item>
          <StyledButton type="primary" htmlType="submit" disabled={loading}>
            {initialData ? "Actualizar" : "Agregar"}
          </StyledButton>
        </FormContainer>
      </Spin>
    </Modal>
  );
}
