// components/forms/RowShelfForm.jsx
import React, { useEffect } from "react";
import * as antd from "antd";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { createRowShelf, updateRowShelf } from "../../../../../../../firebase/warehouse/RowShelfService";
import { selectWarehouse } from "../../../../../../../features/warehouse/warehouseSlice";
const { Form, Input, Button, Modal, message } = antd;

export default function RowShelfForm({ visible, onClose, onSave }) {
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const { selectedWarehouse, selectedShelf, selectedRowShelf } = useSelector(selectWarehouse);

  useEffect(() => {
    if (selectedRowShelf) {
      form.setFieldsValue(selectedRowShelf); // Rellenar el formulario con los datos de la fila de estante para editar
    } else {
      form.resetFields(); // Limpiar el formulario si es una nueva fila de estante
    }
  }, [selectedRowShelf, form]);

  const handleFinish = async (values) => {
    try {
      const newRowShelf = {
        ...values,
        capacity: parseInt(values.capacity, 10), // Convertir la capacidad a entero
      };

      if (selectedRowShelf?.id) {
        // Actualizar una fila de estante existente
        await updateRowShelf(
          user,
          selectedWarehouse?.id,
          selectedShelf?.id,
          selectedRowShelf?.id,
          newRowShelf);
        message.success("Fila de estante actualizada con éxito.");
      } else {
        // Crear una nueva fila de estante
        await createRowShelf(
          user,
          selectedWarehouse?.id,
          selectedShelf?.id,
          selectedRowShelf?.id,
          newRowShelf
        );
        message.success("Fila de estante creada con éxito.");
      }

      onSave && onSave(newRowShelf); // Llamar a la función de guardado externa
      form.resetFields(); // Limpiar los campos del formulario después de guardar
      onClose(); // Cerrar el modal después de guardar
    } catch (error) {
      console.error("Error al guardar la fila de estante: ", error);
      message.error("Error al guardar la fila de estante."); // Mostrar mensaje de error
    }
  };

  return (
    <Modal
      title={selectedRowShelf ? "Editar Fila de Estante" : "Añadir Fila de Estante"}
      open={visible}
      onCancel={onClose}
      footer={null} // No mostrar pie de página de botones por defecto
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={selectedRowShelf}
        onFinish={handleFinish}
      >
        <Form.Item
          name="name"
          label="Nombre"
          rules={[{ required: true, message: "Por favor, ingrese el nombre" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="shortName" label="Nombre Corto">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Descripción">
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          name="capacity"
          label="Capacidad"
          rules={[{ required: true, message: "Por favor, ingrese la capacidad" }]}
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
