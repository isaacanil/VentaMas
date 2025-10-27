import { Form, Input, Button, Modal, Spin, message } from "antd";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectUser } from "../../../../../../../features/auth/userSlice";
import { clearShelfForm, closeShelfForm, selectShelfState, setShelfError, setShelfLoading, updateShelfFormData } from "../../../../../../../features/warehouse/shelfModalSlice";
import { createShelf, updateShelf } from "../../../../../../../firebase/warehouse/shelfService";

export function ShelfForm({ }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { formData, isOpen, path, loading } = useSelector(selectShelfState); // Obtener la ruta
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
      dispatch(setShelfError(null));
      dispatch(setShelfLoading(true));

      // Sanitize the data before sending to Firebase
      const newShelf = {
        ...formData,
        name: values.name?.trim() || '',
        shortName: values.shortName?.trim() || '',
        description: values.description?.trim() || '',
        rowCapacity: Number.isNaN(parseInt(values.rowCapacity, 10)) ? 0 : parseInt(values.rowCapacity, 10)
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
      dispatch(setShelfError(error.message || 'Error al guardar el estante.'));
    } finally {
      dispatch(setShelfLoading(false));
    }
  };

  const handleClose = () => {
    dispatch(clearShelfForm());
    dispatch(closeShelfForm());
    form.resetFields();
  };
  const handleFormChange = (_, allValues) => {
    dispatch(updateShelfFormData(allValues)); // Actualiza el estado del formulario con todos los valores
  };

  return (
    <Modal
      title={formData?.id ? "Editar Estante" : "Añadir Estante"}
      open={isOpen}
      onCancel={handleClose}
      footer={null} // No mostrar pie de página de botones por defecto
      destroyOnClose
    >
      <Spin spinning={loading} tip={formData?.id ? "Actualizando estante..." : "Creando estante..."}>
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
            name="rowCapacity"
            label="Capacidad de Fila"
            rules={[{ required: true, message: "Por favor, ingrese la capacidad de fila" }]}
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
