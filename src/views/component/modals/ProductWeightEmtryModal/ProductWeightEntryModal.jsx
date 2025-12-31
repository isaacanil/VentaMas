import { Modal, Input, Form, Button, notification } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { addProduct } from '@/features/cart/cartSlice';
import { formatPrice } from '@/utils/format';
import { getTotalPrice } from '@/utils/pricing';


const getPricePerUnit = (currentProduct) => {
  if (!currentProduct) return 0;
  return getTotalPrice(
    {
      ...currentProduct,
      amountToBuy: 1,
      weightDetail: {
        ...currentProduct?.weightDetail,
        weight: 1,
      },
    },
    true,
    false,
  );
};

export const ProductWeightEntryModal = ({
  isVisible,
  onCancel,
  onAdd,
  product,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const watchedWeight = Form.useWatch('weight', form);

  const pricePerUnit = useMemo(
    () => getPricePerUnit(product),
    [product],
  );

  const totalPrice = useMemo(() => {
    const weight = Number(watchedWeight ?? 1);
    const safeWeight = Number.isFinite(weight) ? weight : 0;
    return safeWeight * pricePerUnit;
  }, [pricePerUnit, watchedWeight]);

  useEffect(() => {
    // Asegúrate de que el input de peso esté enfocado y seleccionado al abrir el modal
    if (isVisible) {
      setTimeout(() => {
        const el = document.getElementById('weightInput');
        el?.focus?.();
        el?.select?.();
      }, 100);
    }
  }, [isVisible]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      // Ahora, "values" contiene el peso directamente bajo la clave "weight"
      const weight = values.weight;
      if (weight <= 0) {
        notification.error({
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
            suffix={product?.weightDetail?.weightUnit}
            type="number"
            step="0.001"
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
