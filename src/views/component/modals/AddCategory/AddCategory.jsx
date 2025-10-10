import { Modal, Typography, Input, Form, notification } from 'antd';
import { useEffect } from 'react';

import { useCategoryState } from '../../../../Context/CategoryContext/CategoryContext';

const { Title } = Typography;

const AddCategoryModal = () => {
  const { category, setCategory, categoryState, onSubmit, onClose } = useCategoryState();
  const { type, isOpen } = categoryState;
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({ name: category.name });
    }
  }, [isOpen, category.name, form]);

  const handleOk = async () => {
    try {
      const { name } = await form.validateFields();
      alert(name);
      if (!name) {
        notification.error({ message: 'El nombre de la categoría no puede estar vacío' });
        return;
      }
     
      const newCat = {
        ...category,
        name,
      };

      onSubmit(newCat);

      notification.success({
        message: type === 'create' ? 'Categoría creada con éxito' : 'Categoría actualizada con éxito',
      });
      form.resetFields();
      onClose();
    } catch (err) {
      console.error('Error al validar el formulario:', err);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      title={<Title level={4}>{type === 'create' ? 'Crear Categoría' : 'Actualizar Categoría'}</Title>}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={type === 'create' ? 'Crear' : 'Actualizar'}
      cancelText="Cancelar"
      width={400}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: category.name }}
      >
        <Form.Item
          name="name"
          label="Nombre de la Categoría"
          rules={[{ required: true, message: 'Por favor ingresa el nombre de la categoría' }]}
        >
          <Input placeholder="Nombre de la Categoría" autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCategoryModal;