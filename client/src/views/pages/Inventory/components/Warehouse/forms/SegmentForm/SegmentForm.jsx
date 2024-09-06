// components/forms/SegmentForm.jsx
import React from "react";
import * as antd from "antd";
const { Form, Input, Button, Modal } = antd;

export default function SegmentForm({ visible, onClose, onSave, initialData = {} }) {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    const newSegment = {
      id: initialData.id || Date.now(), // Usar un ID único si es nuevo
      ...values,
      capacity: parseInt(values.capacity),
    };
    onSave(newSegment); // Llamar a la función de guardado
    form.resetFields(); // Limpiar los campos del formulario después de guardar
  };

  return (
    <Modal
    title="Añadir/Editar Segmento"
    open={visible}
    onCancel={onClose}
    footer={null} // No mostrar pie de página de botones por defecto
  >
    <Form
      form={form}
      layout="vertical"
      initialValues={initialData}
      onFinish={handleFinish}
    >
      <Form.Item
        name="name"
        label="Nombre"
        rules={[{ required: true, message: "Por favor, ingrese el nombre" }]}
      >
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
