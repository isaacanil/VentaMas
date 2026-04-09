import { Modal, Typography, Input, Form, notification } from 'antd';
import { useCategoryState } from '@/Context/CategoryContext/useCategoryState';

const { Title } = Typography;

interface AddCategoryFormValues {
  name: string;
}

const AddCategoryModal = () => {
  const { category, categoryState, onSubmit, onClose } = useCategoryState();
  const { type, isOpen } = categoryState;
  const [form] = Form.useForm<AddCategoryFormValues>();

  const handleOk = async () => {
    const values = await form.validateFields().catch((error: unknown) => {
      console.error('Error al validar el formulario:', error);
      return null as AddCategoryFormValues | null;
    });

    if (!values?.name) {
      notification.error({
        message: 'El nombre de la categoría no puede estar vacío',
      });
      return;
    }

    const successMessage =
      type === 'create'
        ? 'Categoría creada con éxito'
        : 'Categoría actualizada con éxito';

    const newCat = {
      ...category,
      name: values.name,
    };

    onSubmit(newCat);

    notification.success({
      message: successMessage,
    });
    form.resetFields();
    onClose();
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const handleAfterOpenChange = (open: boolean) => {
    if (open) {
      form.setFieldsValue({ name: category.name });
      return;
    }

    form.resetFields();
  };

  return (
    <Modal
      open={isOpen}
      title={
        <Title level={4}>
          {type === 'create' ? 'Crear Categoría' : 'Actualizar Categoría'}
        </Title>
      }
      onOk={handleOk}
      onCancel={handleCancel}
      okText={type === 'create' ? 'Crear' : 'Actualizar'}
      cancelText="Cancelar"
      width={400}
      destroyOnHidden
      zIndex={2000}
      afterOpenChange={handleAfterOpenChange}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: category.name }}
      >
        <Form.Item
          name="name"
          label="Nombre de la Categoría"
          rules={[
            {
              required: true,
              message: 'Por favor ingresa el nombre de la categoría',
            },
          ]}
        >
          <Input placeholder="Nombre de la Categoría" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCategoryModal;
