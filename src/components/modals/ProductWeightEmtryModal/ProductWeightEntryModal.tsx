import { Modal, Input, Form, Button, notification } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { addProduct, SelectCartData } from '@/features/cart/cartSlice';
import type { Product } from '@/features/cart/types';
import { resolveProductForCartDocumentCurrency } from '@/features/cart/utils/documentPricing';
import {
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import type { MonetaryRateConfig } from '@/utils/accounting/lineMonetary';
import { formatPriceByCurrency } from '@/utils/format';
import { getTotalPrice } from '@/utils/pricing';

type ProductWeightEntryModalProps = {
  isVisible: boolean;
  onCancel: () => void;
  onAdd?: (product: Product) => void;
  product: Product;
};

type WeightFormValues = {
  weight?: number | string;
};

const getPricePerUnit = (currentProduct: Product | null | undefined) => {
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
}: ProductWeightEntryModalProps) => {
  const [form] = Form.useForm<WeightFormValues>();
  const dispatch = useDispatch();
  const cartData = useSelector(SelectCartData) as {
    documentCurrency?: SupportedDocumentCurrency;
    functionalCurrency?: SupportedDocumentCurrency;
    manualRatesByCurrency?: Partial<
      Record<SupportedDocumentCurrency, MonetaryRateConfig>
    >;
    products?: Product[];
  } | null;
  const watchedWeight = Form.useWatch('weight', form);
  const currentCartCurrencies = useMemo(
    () =>
      Array.isArray(cartData?.products)
        ? cartData.products
            .map((item) => item?.monetary?.documentCurrency)
            .filter(
              (currency): currency is SupportedDocumentCurrency =>
                Boolean(currency),
            )
        : [],
    [cartData?.products],
  );

  const pricePerUnit = useMemo(() => getPricePerUnit(product), [product]);

  const totalPrice = useMemo(() => {
    const weight = Number(watchedWeight ?? 1);
    const safeWeight = Number.isFinite(weight) ? weight : 0;
    return safeWeight * pricePerUnit;
  }, [pricePerUnit, watchedWeight]);

  useEffect(() => {
    // Asegúrate de que el input de peso esté enfocado y seleccionado al abrir el modal
    if (isVisible) {
      setTimeout(() => {
        const el = document.getElementById(
          'weightInput',
        ) as HTMLInputElement | null;
        el?.focus();
        el?.select();
      }, 100);
    }
  }, [isVisible]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      // Ahora, "values" contiene el peso directamente bajo la clave "weight"
      const weight = Number(values.weight);
      if (weight <= 0) {
        notification.error({
          message: 'Peso Inválido',
          description: 'El peso del producto debe ser mayor a 0.',
          placement: 'top',
        });
        return;
      }
      const productData: Product = {
        ...product,
        weightDetail: {
          ...product.weightDetail,
          weight: weight, // Asegurándonos de que el peso es un número
        },
      };
      const documentCurrency = normalizeSupportedDocumentCurrency(
        cartData?.documentCurrency,
      );
      const resolution = resolveProductForCartDocumentCurrency(
        productData,
        documentCurrency,
        {
          hasCartProducts: Array.isArray(cartData?.products)
            ? cartData.products.length > 0
            : false,
          functionalCurrency: normalizeSupportedDocumentCurrency(
            cartData?.functionalCurrency,
          ),
          manualRatesByCurrency: cartData?.manualRatesByCurrency,
          currentCartCurrencies,
        },
      );

      if (!resolution.eligible || !resolution.product) {
        notification.warning({
          message: 'Producto no elegible para esta moneda',
          description:
            resolution.reason ??
            'Este producto no puede agregarse con la moneda documental actual.',
          placement: 'top',
        });
        return;
      }

      dispatch(addProduct(resolution.product));
      onAdd?.(resolution.product);
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
          name="weight"
          label="Peso"
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
          <span className="ant-form-text">
            {formatPriceByCurrency(
              totalPrice,
              normalizeSupportedDocumentCurrency(cartData?.documentCurrency),
            )}
          </span>
        </Form.Item>
      </Form>
    </Modal>
  );
};
