// components/forms/SegmentForm.jsx
import * as antd from "antd";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectUser } from "../../../../../../../features/auth/userSlice";
import {
  clearSegmentForm,
  closeSegmentForm,
  selectSegmentState,
  setSegmentError,
  setSegmentLoading,
  updateSegmentFormData
} from "../../../../../../../features/warehouse/segmentModalSlice";
import { createSegment, updateSegment } from "../../../../../../../firebase/warehouse/segmentService";

const { Form, Input, Button, Modal, Spin, message } = antd;

export default function SegmentForm() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { formData, isOpen, path, loading } = useSelector(selectSegmentState);
  const user = useSelector(selectUser);

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
      dispatch(setSegmentError(null));
      dispatch(setSegmentLoading(true));

      const warehouseId = path[0]?.id;
      const shelfId = path[1]?.id;
      const rowShelfId = path[2]?.id;
      if (!warehouseId || !shelfId || !rowShelfId) {
        throw new Error('No se encontró el contexto completo de ubicación');
      }

      const sanitizedSegment = {
        ...formData,
        ...values,
        capacity: Number.isNaN(parseInt(values.capacity, 10)) ? 0 : parseInt(values.capacity, 10),
        warehouseId,
        shelfId,
        rowShelfId,
      };

      if (formData?.id) {
        await updateSegment(user, sanitizedSegment);
        message.success("Segmento actualizado con éxito.");
      } else {
        const { id, ...payload } = sanitizedSegment;
        await createSegment({
          user,
          segmentData: payload
        });
        message.success("Segmento creado con éxito.");
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar el segmento:", error);
      message.error(error.message || "Error al guardar el segmento.");
      dispatch(setSegmentError(error.message || 'Error al guardar el segmento.'));
    } finally {
      dispatch(setSegmentLoading(false));
    }
  };

  const handleClose = () => {
    dispatch(clearSegmentForm());
    dispatch(closeSegmentForm());
    form.resetFields();
  };

  const handleFormChange = (_, allValues) => {
    dispatch(updateSegmentFormData(allValues));
  };

  return (
    <Modal
      title={formData?.id ? "Editar Segmento" : "Añadir Segmento"}
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
    >
      <Spin spinning={loading} tip={formData?.id ? "Actualizando segmento..." : "Creando segmento..."}>
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
            <Input disabled={loading} />
          </Form.Item>
          <Form.Item
            name="shortName"
            label="Nombre Corto"
            rules={[{ required: true, message: "Por favor, ingrese el nombre corto" }]}
          >
            <Input disabled={loading} />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea disabled={loading} />
          </Form.Item>
          <Form.Item
            name="capacity"
            label="Capacidad"
            rules={[{ required: true, message: "Por favor, ingrese la capacidad" }]}
          >
            <Input type="number" min="0" disabled={loading} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {formData?.id ? "Actualizar" : "Crear"}
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
