// components/forms/SegmentForm.jsx
import * as antd from "antd";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectUser } from "../../../../../../../features/auth/userSlice";
import { clearSegmentForm, closeSegmentForm, selectSegmentState, updateSegmentFormData } from "../../../../../../../features/warehouse/segmentModalSlice";
import { selectWarehouse } from "../../../../../../../features/warehouse/warehouseSlice";
import { createSegment, updateSegment } from "../../../../../../../firebase/warehouse/segmentService";

const { Form, Input, Button, Modal, message } = antd;

export default function SegmentForm() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { formData, isOpen, path } = useSelector(selectSegmentState); // Destructurar 'path' desde el estado
  const { selectedWarehouse, selectedShelf, selectedRowShelf, selectedSegment } = useSelector(selectWarehouse);
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
      const segmentData = {
        ...formData,
        ...values,
        capacity: parseInt(values.capacity, 10),
        warehouseId: path[0]?.id,
        shelfId: path[1]?.id,
        rowShelfId: path[2]?.id,
      };

      if (formData?.id) {
        await updateSegment(user, segmentData);
        message.success("Segmento actualizado con éxito.");
      } else {
        await createSegment({
          user,
          segmentData
        });
        message.success("Segmento creado con éxito.");
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar el segmento:", error);
      message.error("Error al guardar el segmento."); // Mostrar mensaje de error
    }
  };

  const handleClose = () => {
    dispatch(clearSegmentForm());
    dispatch(closeSegmentForm());
    form.resetFields();
  }

  const handleFormChange = (changedFields) => {
    dispatch(updateSegmentFormData(changedFields)); // Actualiza el estado del formulario
  };

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
