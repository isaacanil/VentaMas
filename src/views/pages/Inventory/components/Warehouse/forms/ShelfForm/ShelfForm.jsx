import { Form, Input, Button, Modal, message } from "antd";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectUser } from "../../../../../../../features/auth/userSlice";
import { clearShelfForm, closeShelfForm, selectShelfState, updateShelfFormData } from "../../../../../../../features/warehouse/shelfModalSlice";
import { createShelf, updateShelf } from "../../../../../../../firebase/warehouse/shelfService";

export function ShelfForm({ }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { formData, isOpen, path } = useSelector(selectShelfState) // Obtener la ruta
  const user = useSelector(selectUser);

  useEffect(() => {
    if (formData) {
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
    }
  }, [formData, form]);

  const handleFinish = async (values) => {
    try {
      // Sanitize the data before sending to Firebase
      const newShelf = {
        ...formData,
        name: values.name || '',
        shortName: values.shortName || '',
        description: values.description || '',
        rowCapacity: parseInt(values.rowCapacity, 10) || 0
      };
      
      const warehouseId = path[0]?.id;
      if (!warehouseId) {
        throw new Error('No se encontró el ID del almacén');
      }

      if (formData?.id) {
        await updateShelf(user, warehouseId, newShelf);
        message.success("Estante actualizado con éxito.");
      } else {
        await createShelf(user, warehouseId, newShelf);
        message.success("Estante creado con éxito.");
      }
      handleClose();
    } catch (error) {
      console.error("Error al guardar el estante: ", error);
      message.error(error.message || "Error al guardar el estante.");
    }
  };

  const handleClose = () => {
    dispatch(clearShelfForm());
    dispatch(closeShelfForm());
    form.resetFields();
  }
  const handleFormChange = (changedFields) => {
    dispatch(updateShelfFormData(changedFields)); // Actualiza el estado del formulario
  };

  return (
    <Modal
      title={formData?.id ? "Editar Estante" : "Añadir Estante"}
      open={isOpen}
      onCancel={handleClose}
      footer={null} // No mostrar pie de página de botones por defecto
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
          rules={[{ required: true, message: "Por favor, ingrese el nombre" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="shortName"
          label="Nombre Corto"
          rules={[{ required: true, message: "Por favor, ingrese el nombre corto" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Descripción">
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          name="rowCapacity"
          label="Capacidad de Fila"
          rules={[{ required: true, message: "Por favor, ingrese la capacidad de fila" }]}
        >
          <Input type="number" min="0" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Guardar
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
