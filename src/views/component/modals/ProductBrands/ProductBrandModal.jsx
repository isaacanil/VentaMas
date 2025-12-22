import { Form, Input, Modal, message } from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '../../../../features/auth/userSlice';
import {
  closeBrandModal,
  selectProductBrandModal,
} from '../../../../features/productBrands/productBrandSlice';
import {
  fbAddProductBrand,
  fbUpdateProductBrand,
} from '../../../../firebase/products/brands/productBrands';

const ProductBrandModal = () => {
  const dispatch = useDispatch();
  const { isOpen, initialValues } = useSelector(selectProductBrandModal);
  const user = useSelector(selectUser);
  const [form] = Form.useForm();

  const isUpdate = Boolean(initialValues);

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        name: initialValues?.name || '',
      });
    } else {
      form.resetFields();
    }
  }, [form, initialValues, isOpen]);

  const handleClose = () => {
    dispatch(closeBrandModal());
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (isUpdate) {
        await fbUpdateProductBrand(user, {
          id: initialValues.id,
          name: values.name,
        });
        message.success('Marca actualizada con éxito.');
      } else {
        await fbAddProductBrand(user, { name: values.name });
        message.success('Marca creada con éxito.');
      }
      handleClose();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      console.error('Error al procesar la marca:', error);
      message.error('No se pudo guardar la marca. Intenta nuevamente.');
    }
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
          <Input placeholder="Ej: Marca Propia" autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProductBrandModal;
