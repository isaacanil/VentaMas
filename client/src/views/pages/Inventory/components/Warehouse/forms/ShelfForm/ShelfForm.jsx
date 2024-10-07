import React, { useEffect } from "react";
import * as antd from "antd";
import { shelfRepository } from "../../../../../../../firebase/warehouse/shelfRepository";
import { createShelf, updateShelf } from "../../../../../../../firebase/warehouse/shelfService";
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { selectWarehouse } from "../../../../../../../features/warehouse/warehouseSlice";
import { clearShelfForm, closeShelfForm, selectShelfState, updateShelfFormData } from "../../../../../../../features/warehouse/shelfSlice";

const { Form, Input, Button, Modal, message } = antd;

export function ShelfForm({ }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { formData, isOpen } = useSelector(selectShelfState)
  const { selectedWarehouse } = useSelector(selectWarehouse);
  const user = useSelector(selectUser);
  const warehouseId = selectedWarehouse?.id;

  useEffect(() => {
    if (formData) {
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
    }
  }, [formData, form]);

  const handleFinish = async (values) => {
    try {
      const newShelf = {
        ...formData,
        ...values,
        rowCapacity: parseInt(values.rowCapacity, 10), // Convertir a entero
      };

      if (formData?.id) {
        console.log(formData)
        // Actualizar un estante existente
        await updateShelf(
          user,
          warehouseId,
          newShelf
        );
        antd.message.success("Estante actualizado con éxito.");
      } else {
        // Crear un nuevo estante
        await createShelf(user, warehouseId, newShelf);
   
        antd.message.success("Estante creado con éxito.");
      }
      handleClose();
    } catch (error) {
      console.error("Error al guardar el estante: ", error);
      antd.message.error("Error al guardar el estante."); // Mostrar mensaje de error
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
