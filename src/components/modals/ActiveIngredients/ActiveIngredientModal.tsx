import { Modal, Input, message, Form } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import {
  closeModal,
  selectActiveIngredientModal,
} from '@/features/activeIngredients/activeIngredientsSlice';
import { selectUser } from '@/features/auth/userSlice';
import {
  fbAddActiveIngredient,
  fbUpdateActiveIngredient,
} from '@/firebase/products/activeIngredient/activeIngredients';

interface ActiveIngredientFormValues {
  name: string;
}

const ActiveIngredientModal = () => {
  const dispatch = useDispatch();
  type ActiveIngredientModalRootState = Parameters<
    typeof selectActiveIngredientModal
  >[0];
  const { isOpen, initialValues } = useSelector(
    (state: ActiveIngredientModalRootState) =>
      selectActiveIngredientModal(state),
  );
  type UserRootState = Parameters<typeof selectUser>[0];
  const user = useSelector((state: UserRootState) => selectUser(state));

  const [form] = Form.useForm<ActiveIngredientFormValues>();

  // Determinar si es una creación o actualización
  const isUpdate = initialValues !== null;

  const handleClose = () => {
    dispatch(closeModal());
  };

  const handleAfterOpenChange = (open: boolean) => {
    if (open) {
      form.setFieldsValue({
        name: initialValues ? initialValues.name : '',
      });
      return;
    }

    form.resetFields();
  };

  const handleOk = async () => {
    const values = await form.validateFields().catch((error: unknown) => {
      console.error('Active ingredient validation failed:', error);
      message.error('Hubo un error al procesar la solicitud.');
      return null as ActiveIngredientFormValues | null;
    });

    if (!values) {
      return;
    }

    if (!user) {
      message.error('No se encontró un usuario válido.');
      return;
    }

    const submitRequest =
      isUpdate && initialValues
        ? () =>
            fbUpdateActiveIngredient(user, {
              id: initialValues.id,
              name: values.name,
            })
        : () => fbAddActiveIngredient(user, { name: values.name });
    const successMessage = isUpdate
      ? 'Principio activo actualizado con éxito.'
      : 'Principio activo creado con éxito.';

    try {
      await submitRequest();
    } catch (error) {
      console.error('Active ingredient validation failed:', error);
      message.error('Hubo un error al procesar la solicitud.');
      return;
    }

    message.success(successMessage);
    handleClose();
  };

  const handleCancel = () => {
    dispatch(closeModal());
  };
  return (
    <Modal
      title={
        isUpdate ? 'Actualizar Principio Activo' : 'Crear Principio Activo'
      }
      open={isOpen}
      forceRender
      onOk={handleOk}
      width={400}
      onCancel={handleCancel}
      okText={isUpdate ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
      afterOpenChange={handleAfterOpenChange}
    >
      <Form form={form} layout="vertical" name="active_ingredient_form">
        <Form.Item
          name="name"
          label="Nombre del Principio Activo"
          rules={[
            {
              required: true,
              message: 'Por favor ingrese el nombre del principio activo',
            },
          ]}
        >
          <Input placeholder="Nombre del Principio Activo" />
        </Form.Item>
        {/* Puedes agregar más campos aquí si es necesario */}
      </Form>
    </Modal>
  );
};

export default ActiveIngredientModal;
