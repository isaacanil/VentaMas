import React, { useEffect } from "react";
import * as antd from "antd";
import { shelfRepository } from "../../../../../../../firebase/warehouse/shelfRepository";
import { updateShelf } from "../../../../../../../firebase/warehouse/shelfService";
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { useSelector } from "react-redux";
import { selectWarehouse } from "../../../../../../../features/warehouse/warehouseSlice";

const { Form, Input, Button, Modal, message } = antd;

export function ShelfForm({ visible, onClose, onSave = null, }) {
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const {selectedWarehouse, selectedShelf} = useSelector(selectWarehouse);
  const warehouseId = selectedWarehouse?.id;
  const shelf = selectedShelf;
  useEffect(() => {
    if (shelf) {
      form.setFieldsValue(shelf); // Rellenar el formulario con los datos del estante para editar
    } else {
      form.resetFields(); // Limpiar el formulario si es un nuevo estante
    }
  }, [shelf, form]);

  const handleFinish = async (values) => {
    try {
      const newShelf = {
        ...values,
        rowCapacity: parseInt(values.rowCapacity, 10), // Convertir a entero
      };

      if (shelf) {
        // Actualizar un estante existente
        await updateShelf(
          user,
          warehouseId,
          shelf?.id,
          newShelf
        );
        antd.message.success("Estante actualizado con éxito.");
      } else {
        // Crear un nuevo estante
        await shelfRepository.create(
          user,
          warehouseId,
          newShelf
        );
        antd.message.success("Estante creado con éxito.");
      }

      onSave && onSave(newShelf); // Llamar a la función de guardado externa
      form.resetFields(); // Limpiar los campos del formulario después de guardar
      onClose(); // Cerrar el modal después de guardar
    } catch (error) {
      console.error("Error al guardar el estante: ", error);
      antd.message.error("Error al guardar el estante."); // Mostrar mensaje de error
    }
  };

  return (
    <Modal
      title={shelf ? "Editar Estante" : "Añadir Estante"}
      open={visible}
      onCancel={onClose}
      footer={null} // No mostrar pie de página de botones por defecto
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
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
