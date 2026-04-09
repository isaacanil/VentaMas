import { Form, Input, Modal, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  closeBrandModal,
  selectProductBrandModal,
} from '@/features/productBrands/productBrandSlice';
import {
  fbAddProductBrand,
  fbUpdateProductBrand,
} from '@/firebase/products/brands/productBrands';
import type { UserWithBusiness } from '@/types/users';

type BrandRecord = {
  id?: string;
  name?: string;
};

type BrandModalState = {
  isOpen: boolean;
  initialValues: BrandRecord | null;
};

type BrandFormValues = {
  name: string;
};

const ProductBrandModal = () => {
  const dispatch = useDispatch();
  const { isOpen, initialValues } = useSelector(
    selectProductBrandModal,
  ) as BrandModalState;
  const user = useSelector(selectUser) as UserWithBusiness | null;
  const [form] = Form.useForm<BrandFormValues>();

  const isUpdate = Boolean(initialValues);

  const handleClose = () => {
    dispatch(closeBrandModal());
  };

  const handleAfterOpenChange = (open: boolean) => {
    if (open) {
      form.setFieldsValue({
        name: initialValues?.name || '',
      });
      return;
    }

    form.resetFields();
  };

  const handleOk = async () => {
    const values = await form.validateFields().catch((error: unknown) => {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return null as BrandFormValues | null;
      }
      console.error('Error al procesar la marca:', error);
      message.error('No se pudo guardar la marca. Intenta nuevamente.');
      return null as BrandFormValues | null;
    });

    if (!values) {
      return;
    }

    if (!user?.businessID) {
      message.error('No se encontró un negocio válido.');
      return;
    }

    const submitRequest = isUpdate
      ? () =>
          fbUpdateProductBrand(user, {
            id: initialValues?.id,
            name: values.name,
          })
      : () => fbAddProductBrand(user, { name: values.name });
    const successMessage = isUpdate
      ? 'Marca actualizada con éxito.'
      : 'Marca creada con éxito.';

    try {
      await submitRequest();
    } catch (error) {
      console.error('Error al procesar la marca:', error);
      message.error('No se pudo guardar la marca. Intenta nuevamente.');
      return;
    }

    message.success(successMessage);
    handleClose();
  };

  return (
    <Modal
      title={isUpdate ? 'Actualizar marca' : 'Registrar marca'}
      open={isOpen}
      onOk={handleOk}
      onCancel={handleClose}
      okText={isUpdate ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
      width={400}
      zIndex={2000}
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" name="product_brand_form">
        <Form.Item
          name="name"
          label="Nombre de la marca"
          rules={[
            { required: true, message: 'Ingresa el nombre de la marca.' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const trimmed = value.replace(/\s+/g, ' ').trim();
                return trimmed
                  ? Promise.resolve()
                  : Promise.reject(new Error('La marca no puede estar vacía.'));
              },
            },
          ]}
        >
          <Input placeholder="Ej: Marca Propia" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProductBrandModal;
