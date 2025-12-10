import * as antd from 'antd';
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { addProduct } from '../../../../features/cart/cartSlice';
import { formatPrice } from '@/utils/format';../../../../utils/pricing';

const { Modal, Input, Form, Button } = antd;

export const ProductWeightEntryModal = ({
  isVisible,
  onCancel,
  onAdd,
  product,
}) => {
  const [form] = Form.useForm();
  const [totalPrice, setTotalPrice] = useState(0);
  const dispatch = useDispatch();
  useEffect(() => {
    // Asegúrate de que el input de peso esté enfocado y seleccionado al abrir el modal
    if (isVisible) {
      setTimeout(() => {
        document.getElementById('weightInput').focus();
        document.getElementById('weightInput').select();
      }, 100);
    }
  }, [isVisible]);
  useEffect(() => {
    setTotalPrice(getTotalPrice(product) * 1.0);
  }, []);

  const handleOk = () => {
    form.validateFields().then((values) => {
      // Ahora, "values" contiene el peso directamente bajo la clave "weight"
      const weight = values.weight;
      if (weight <= 0) {
        antd.notification.error({
          message: 'Peso Inválido',
          description: 'El peso del producto debe ser mayor a 0.',
          placement: 'top',
        });
        return;
      }
      const productData = {
        ...product,
        weightDetail: {
          ...product.weightDetail,
          weight: parseFloat(weight), // Asegurándonos de que el peso es un número
        },
      };
      dispatch(addProduct(productData));
      onAdd?.(productData);
      form.resetFields();
      onCancel(); // Cerrar modal después de agregar el producto
    });
  };

  const handleCancel = () => {
    onCancel && onCancel();
    form.resetFields();
  };

  const handleWeightChange = (e) => {
    e.preventDefault();
    const weight = e.target.value;
    const pricePerUnit = getTotalPrice(product); // Asume que este valor viene del objeto del producto

    setTotalPrice(weight * pricePerUnit);
  };

  return (
    <Modal
      title="Ingresar Peso del Producto"
      open={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <Button key="back" onClick={handleCancel}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          Agregar
        </Button>,
      ]}
    >
      <Form form={form} initialValues={{ weight: 1.0 }}>
        <Form.Item label="Nombre">
          <span>{product?.name}</span>
        </Form.Item>
        <Form.Item label="Unidad de Medida">
          <span className="ant-form-text">
            {product?.weightDetail?.weightUnit}
          </span>
        </Form.Item>
        <Form.Item
          name={['weight']}
          label="Peso"
          type="number"
          rules={[
            {
              required: true,
              message: 'Por favor ingresa el peso del producto',
            },
          ]}
        >
          <Input
            id="weightInput"
            defaultValue={1.0}
            suffix={product?.weightDetail?.weightUnit}
            type="number"
            step="0.001"
            onChange={handleWeightChange}
            autoFocus
          />
        </Form.Item>
        <Form.Item label="Precio Total">
          <span className="ant-form-text">{formatPrice(totalPrice)}</span>
        </Form.Item>
      </Form>
    </Modal>
  );
};
