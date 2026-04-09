import { Button, Form, Modal, message } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { selectUpdateProductData } from '@/features/updateProduct/updateProductSlice';
import { fbUpsetSaleUnits } from '@/firebase/products/saleUnits/fbUpdateSaleUnit';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';
import type { InventoryUser } from '@/utils/inventory/types';

import { SaleUnitPriceCards } from './SaleUnitForm/SaleUnitPriceCards';
import { SaleUnitPricingFields } from './SaleUnitForm/SaleUnitPricingFields';
import { buildPriceCards } from './SaleUnitForm/saleUnitPricing';
import { Group } from './SaleUnitForm/styles';

import type { SaleUnitFormProps, SaleUnitFormValues } from './SaleUnitForm/types';

const initialData: SaleUnitFormValues = {
  unitName: '',
  packSize: 1,
  pricing: {
    currency: 'DOP',
    tax: 0,
    cost: 0,
    listPrice: 0,
    stock: 0,
    avgPrice: 0,
    price: 0,
    minPrice: 0,
    listPriceEnabled: false,
    avgPriceEnabled: false,
    minPriceEnabled: false,
  },
};

const hasBusiness = (
  candidate: InventoryUser | null,
): candidate is UserWithBusiness => Boolean(candidate?.businessID);

const SaleUnitForm = ({
  isOpen,
  initialValues,
  onSubmit,
  onCancel,
}: SaleUnitFormProps) => {
  const [form] = Form.useForm<SaleUnitFormValues>();
  const user = useSelector(selectUser) as InventoryUser | null;
  const {
    product: { id: productId },
  } = useSelector(selectUpdateProductData) as { product: ProductRecord };

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      return;
    }

    form.resetFields();
  }, [form, initialValues]);

  const pricing = Form.useWatch('pricing', form);
  const cardData = useMemo(
    () => buildPriceCards({ pricing: pricing || {} }),
    [pricing],
  );

  const handleFinish = (values: SaleUnitFormValues) => {
    try {
      if (!hasBusiness(user)) {
        message.error('No se encontro un negocio valido.');
        return;
      }
      if (!productId) {
        message.error('No se encontro el producto asociado.');
        return;
      }

      const data = {
        ...values,
        pricing: { ...values.pricing, price: values.pricing.listPrice },
      };

      if (initialValues) {
        fbUpsetSaleUnits(user, productId, { ...initialValues, ...data });
        message.success('Unidad de venta actualizada correctamente');
      } else {
        fbUpsetSaleUnits(user, productId, data);
        message.success('Unidad de venta agregada correctamente');
      }

      onSubmit();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      title={
        initialValues
          ? 'Editar Unidad de Venta'
          : 'Agregar Nueva Unidad de Venta'
      }
      open={isOpen}
      width={1000}
      style={{ top: 5 }}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" onClick={form.submit}>
          {initialValues ? 'Actualizar' : 'Agregar'}
        </Button>,
      ]}
      onCancel={onCancel}
    >
      <Group>
        <Form
          form={form}
          layout="vertical"
          initialValues={initialData}
          onFinish={handleFinish}
        >
          <SaleUnitPricingFields />
        </Form>
        <SaleUnitPriceCards cardData={cardData} />
      </Group>
    </Modal>
  );
};

export default SaleUnitForm;
