import React from "react";
import * as antd from "antd";

const { Form, Input, Button, Modal } = antd;

export function ShelfForm({ visible, onClose, onSave }) {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    const newShelf = {
      id: Date.now(), // Generar un ID único
      ...values,
      rowCapacity: parseInt(values.rowCapacity),
    };
    onSave(newShelf);
    form.resetFields(); // Limpiar los campos del formulario después de guardar
  };

  return (
    <Modal
      title="Añadir/Editar Estante"
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
