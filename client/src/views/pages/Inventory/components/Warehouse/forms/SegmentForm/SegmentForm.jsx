// components/forms/SegmentForm.jsx
import React from "react";
import * as antd from "antd";
import { selectWarehouse } from "../../../../../../../features/warehouse/warehouseSlice";
import { useSelector } from "react-redux";
import { createSegment, updateSegment } from "../../../../../../../firebase/warehouse/SegmentService";
import { selectUser } from "../../../../../../../features/auth/userSlice";
const { Form, Input, Button, Modal, message } = antd;

export default function SegmentForm({ visible, onClose, onSave, }) {
  const [form] = Form.useForm();
  const {selectedWarehouse, selectedShelf, selectedRowShelf, selectedSegment} = useSelector(selectWarehouse);
  const user = useSelector(selectUser);

  const handleFinish = async (values) => {
    const newSegment = {
      id: selectedSegment?.id || Date.now(), // Usar un ID único si es nuevo
      ...values,
      capacity: parseInt(values.capacity, 10), // Asegurar que la capacidad sea un número entero
    };

    try {
      if (selectedSegment?.id) {
        // Actualizar segmento existente
        await updateSegment(
          user, // Usuario y negocio
          selectedWarehouse?.id, // ID del almacén
          selectedShelf?.id, // ID del estante
          selectedRowShelf?.id, // ID de la fila de estante
          newSegment?.id, // ID del segmento a actualizar
          newSegment // Datos actualizados
        );
        message.success("Segmento actualizado con éxito.");
      } else {
        // Crear nuevo segmento
        await createSegment(
          user, // Usuario y negocio
          selectedWarehouse?.id, // ID del almacén
          selectedShelf?.id, // ID del estante
          selectedRowShelf?.id, // ID de la fila de estante
          newSegment // Datos del nuevo segmento
        );
        message.success("Segmento creado con éxito.");
      }

     onSave && onSave(newSegment); // Llamar a la función de guardado externa para actualizar la vista
      form.resetFields(); // Limpiar los campos del formulario después de guardar
      onClose(); // Cerrar el modal después de guardar
    } catch (error) {
      console.error("Error al guardar el segmento:", error);
      message.error("Error al guardar el segmento.");
    }
  };

  return (
    <Modal
    title={selectedSegment?.id ? "Editar Segmento" : "Añadir Segmento"}
    open={visible}
    onCancel={onClose}
    footer={null} // No mostrar pie de página de botones por defecto
  >
    <Form
      form={form}
      layout="vertical"
      initialValues={selectedSegment}
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
