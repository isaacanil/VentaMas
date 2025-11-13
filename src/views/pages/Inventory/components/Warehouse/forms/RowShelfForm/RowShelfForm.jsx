// components/forms/RowShelfForm.jsx
import * as antd from 'antd';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import {
  clearRowShelfForm,
  closeRowShelfForm,
  selectRowShelfState,
  setRowShelfError,
  setRowShelfLoading,
  updateRowShelfFormData,
} from '../../../../../../../features/warehouse/rowShelfModalSlice';
import {
  createRowShelf,
  updateRowShelf,
} from '../../../../../../../firebase/warehouse/RowShelfService';

const { Form, Input, Button, Modal, Spin, message } = antd;

export default function RowShelfForm() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const { formData, isOpen, path, loading } = useSelector(selectRowShelfState);

  useEffect(() => {
    if (isOpen) {
      if (formData?.id) {
        form.setFieldsValue(formData);
      } else {
        form.resetFields();
      }
    } else {
      form.resetFields();
    }
  }, [isOpen, formData, form]);

  const handleFinish = async (values) => {
    try {
      dispatch(setRowShelfError(null));
      dispatch(setRowShelfLoading(true));

      const warehouseId = path[0]?.id;
      const shelfId = path[1]?.id;
      if (!warehouseId || !shelfId) {
        throw new Error('No se encontró el contexto completo de ubicación');
      }

      const newRowShelf = {
        ...formData,
        ...values,
        capacity: Number.isNaN(parseInt(values.capacity, 10))
          ? 0
          : parseInt(values.capacity, 10),
        warehouseId,
        shelfId,
      };

      if (formData?.id) {
        await updateRowShelf(
          user,
          warehouseId,
          shelfId,
          formData.id,
          newRowShelf,
        );
        message.success('Fila de estante actualizada con éxito.');
      } else {
        await createRowShelf(user, warehouseId, shelfId, newRowShelf);
        message.success('Fila de estante creada con éxito.');
      }

      handleClose();
    } catch (error) {
      console.error('Error al guardar la fila de estante: ', error);
      message.error(error.message || 'Error al guardar la fila de estante.');
      dispatch(
        setRowShelfError(
          error.message || 'Error al guardar la fila de estante.',
        ),
      );
    } finally {
      dispatch(setRowShelfLoading(false));
    }
  };

  const handleClose = () => {
    dispatch(clearRowShelfForm());
    dispatch(closeRowShelfForm());
    form.resetFields();
  };

  const handleFormChange = (_, allValues) => {
    dispatch(updateRowShelfFormData(allValues));
  };

  return (
    <Modal
      title={formData?.id ? 'Editar Fila de Estante' : 'Añadir Fila de Estante'}
      open={isOpen}
      onCancel={handleClose}
      footer={null} // No mostrar pie de página de botones por defecto
      destroyOnHidden
    >
      <Spin
        spinning={loading}
        tip={formData?.id ? 'Actualizando fila...' : 'Creando fila...'}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={formData}
          onFinish={handleFinish}
          onValuesChange={handleFormChange}
        >
          <Form.Item
            name="name"
            label="Nombre"
            rules={[
              { required: true, message: 'Por favor, ingrese el nombre' },
            ]}
          >
            <Input disabled={loading} />
          </Form.Item>
          <Form.Item name="shortName" label="Nombre Corto">
            <Input disabled={loading} />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea disabled={loading} />
          </Form.Item>
          <Form.Item
            name="capacity"
            label="Capacidad"
            rules={[
              { required: true, message: 'Por favor, ingrese la capacidad' },
            ]}
          >
            <Input type="number" min="0" disabled={loading} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Guardar
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
