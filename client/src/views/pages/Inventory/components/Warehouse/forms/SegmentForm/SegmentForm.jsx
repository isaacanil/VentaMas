// components/forms/SegmentForm.jsx
import React, { useEffect } from "react";
import * as antd from "antd";
import { selectWarehouse } from "../../../../../../../features/warehouse/warehouseSlice";
import { useDispatch, useSelector } from "react-redux";
import { createSegment, updateSegment } from "../../../../../../../firebase/warehouse/segmentService";
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { clearSegmentForm, closeSegmentForm, selectSegmentState } from "../../../../../../../features/warehouse/segmentModalSlice";

const { Form, Input, Button, Modal, message } = antd;

export default function SegmentForm() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const {formData, isOpen} = useSelector(selectSegmentState);
  const {selectedWarehouse: warehouse, selectedShelf: shelf, selectedRowShelf: rowShelf, selectedSegment: segment } = useSelector(selectWarehouse);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (formData) {
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
    }
  }, [formData, form]);

  const handleFinish = async (values) => {
    const newSegment = {
      ...formData,
      ...values,
      capacity: parseInt(values.capacity, 10), // Asegurar que la capacidad sea un número entero
    };
    try {
      if (newSegment?.id) {
        await updateSegment(
          user, // Usuario y negocio
          warehouse?.id, // ID del almacén
          shelf?.id, // ID del estante
          rowShelf?.id,  
          newSegment // Datos actualizados
        );
        message.success("Segmento actualizado con éxito.");
      } else {
        await createSegment(
          user, // Usuario y negocio
          warehouse?.id, // ID del almacén
          shelf?.id, // ID del estante
          rowShelf?.id, // ID de la fila de estante
          newSegment // Datos del nuevo segmento
        );
        message.success("Segmento creado con éxito.");
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar el segmento:", error);
      message.error("Error al guardar el segmento.");
    }
  };

  const handleClose = () => {
    form.resetFields();
    dispatch(clearSegmentForm());
    dispatch(closeSegmentForm());
  }

  return (
    <Modal
    title={formData?.id ? "Editar Segmento" : "Añadir Segmento"}
    open={isOpen}
    onCancel={handleClose}
    footer={null} // No mostrar pie de página de botones por defecto
  >
    <Form
      form={form}
      layout="vertical"
      initialValues={formData}
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
          {formData?.id ? "Actualizar" : "Crear"}
        </Button>
      </Form.Item>
    </Form>
  </Modal>
  );
}
