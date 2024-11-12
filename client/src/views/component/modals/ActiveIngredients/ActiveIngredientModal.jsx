import React, { useEffect } from 'react';
import { Modal, Input, Button, Typography, message, Form } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../../../../features/notification/NotificationSlice';
import { closeModal, selectActiveIngredientModal } from '../../../../features/activeIngredients/activeIngredientsSlice';
import { selectUser } from '../../../../features/auth/userSlice';
import {fbAddActiveIngredient, fbUpdateActiveIngredient} from '../../../../firebase/products/activeIngredient/activeIngredients';
const ActiveIngredientModal = () => {

  const dispatch = useDispatch();
  const { isOpen, initialValues } = useSelector(selectActiveIngredientModal);
  const user = useSelector(selectUser);

  const [form] = Form.useForm();

  // Determinar si es una creación o actualización
  const isUpdate = initialValues !== null;

  // Establecer valores iniciales cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        name: initialValues ? initialValues.name : '',
        // Agrega más campos si es necesario
      });
    } else {
      form.resetFields();
    }
  }, [isOpen, initialValues, form]);
const handleClose = () => {
    dispatch(closeModal());
  
}
  const handleOk = async () => {
    try {
      // Validar los campos del formulario
      const values = await form.validateFields();
  
      if (isUpdate) {
        // Actualizar el principio activo
        await fbUpdateActiveIngredient(user, { id: initialValues.id, name: values.name });
        message.success('Principio activo actualizado con éxito.');
      } else {
        // Añadir un nuevo principio activo
        await fbAddActiveIngredient(user, { name: values.name });
        message.success('Principio activo creado con éxito.');
      }
  
      // Cerrar el modal
      handleClose();
    } catch (error) {
      // Manejar errores de validación o de las operaciones asíncronas
      console.log('Validate Failed:', error);
      // Opcionalmente, puedes mostrar un mensaje de error al usuario
      message.error('Hubo un error al procesar la solicitud.');
    }
  };
  

  const handleCancel = () => {
    dispatch(closeModal());
  };

  return (
    <Modal
      title={isUpdate ? 'Actualizar Principio Activo' : 'Crear Principio Activo'}
      open={isOpen}
      onOk={handleOk}
      width={400}
      onCancel={handleCancel}
      okText={isUpdate ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        name="active_ingredient_form"
      >
        <Form.Item
          name="name"
          label="Nombre del Principio Activo"
          rules={[{ required: true, message: 'Por favor ingrese el nombre del principio activo' }]}
        >
          <Input
            placeholder="Nombre del Principio Activo"
            autoFocus
          />
        </Form.Item>
        {/* Puedes agregar más campos aquí si es necesario */}
      </Form>
    </Modal>
  );
};

export default ActiveIngredientModal;
