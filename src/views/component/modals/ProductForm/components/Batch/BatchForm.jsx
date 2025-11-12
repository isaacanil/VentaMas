import { CalendarOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, InputNumber, Modal, notification } from "antd";
import { DateTime } from "luxon";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";

import { selectUser } from "../../../../../../features/auth/userSlice";
import { selectUpdateProductData } from "../../../../../../features/updateProduct/updateProductSlice";
import { createBatch, updateBatch } from "../../../../../../firebase/warehouse/batchService";
import DateUtils from "../../../../../../utils/date/dateUtils";

// Styled Components
const StyledContainer = styled.div`
  padding: 16px;
`;

export const BatchForm = ({
  initialData,
  mode = "create",
  justIcon = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = useSelector(selectUser);
  const { product } = useSelector(selectUpdateProductData);
  const convertedData = {
    ...initialData,
    expirationDate: DateUtils.convertTimestampToDayjs(initialData?.expirationDate),
    manufacturingDate: DateUtils.convertTimestampToDayjs(initialData?.manufacturingDate),
    receivedDate: DateUtils.convertTimestampToDayjs(initialData?.receivedDate),
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(() => {
        setLoading(true);
        form.submit();
      })
      .catch(() => {
        // Validation failed
      });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const onFinish = async (values) => {
    const batchData = {
      ...initialData,
      ...values,
      notes: values?.notes || "",
      productId: product?.id,
      expirationDate: DateUtils.convertDayjsToTimestamp(values?.expirationDate),
      manufacturingDate: DateUtils.convertDayjsToTimestamp(values?.manufacturingDate),
      receivedDate: DateUtils.convertDayjsToTimestamp(values?.receivedDate),    };

    try {
      if (mode === "create") {
        // Crear un nuevo batch
        await createBatch(user, batchData);
        notification.success({
          message: "Lote Creado",
          description: "El lote ha sido creado exitosamente.",
        });
      } else if (mode === "update") {
        // Actualizar un batch existente
        await updateBatch(user, batchData);
        notification.success({
          message: "Lote Actualizado",
          description: "El lote ha sido actualizado exitosamente.",
        });
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error al procesar el lote:', error);
      notification.error({
        message: "Error",
        description: "Ocurrió un error al procesar el lote. Por favor, intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = () => {
    notification.error({
      message: "Error al Crear/Editar Lote",
      description: "Por favor, revisa los errores en el formulario.",
    });  };
  
  const disablePastDates = (current) => {
    return current && current < DateTime.now().startOf('day');
  };

  return (
    <>
      <Button
        icon={initialData ? <EditOutlined /> : <PlusOutlined />}
        onClick={showModal}
        type={mode === "create" ? "primary" : "default"}
      >
        {!justIcon && (
          initialData ? "Editar Lote" : "Crear Lote"
        )}
      </Button>
      <Modal
        title={initialData ? "Editar Lote" : "Crear Nuevo Lote"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={initialData ? "Editar" : "Crear"}
        cancelText="Cancelar"
        okButtonProps={{ loading }}
      >
        <StyledContainer>
          <Form
            form={form}
            layout="vertical"
            initialValues={convertedData}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            preserve={false}
          >
            {/* Nombre corto del lote */}
            <Form.Item
              label={"Nombre corto"}
              name="shortName"
              help="Ingrese un nombre corto para identificar el Lote."
              rules={[
                {
                  required: true,
                  message: "El nombre corto es obligatorio.",
                },
                {
                  min: 2,
                  message: "El nombre corto debe tener al menos 2 caracteres.",
                },
              ]}
            >
              <Input placeholder="Nombre corto del lote" />
            </Form.Item>

            {/* Fecha de expiración */}
            <Form.Item
              label={"Fecha de Expiración (opcional)"}
              name="expirationDate"
              help="Seleccione una fecha de expiración."
           
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                placeholder="Seleccione una fecha"
                suffixIcon={<CalendarOutlined />}
                disabledDate={disablePastDates}
              />
            </Form.Item>
            
            <Form.Item
              label={"Cantidad"}
              name="quantity"
              help="Ingrese la cantidad total de productos en el lote."
              rules={[
                {
                  required: true,
                  message: "La cantidad es obligatoria.",
                },
                {
                  type: "number",
                  min: 1,
                  message: "La cantidad debe ser al menos 1.",
                },
              ]}
            >
              <InputNumber
                min={1}
                style={{ width: "100%" }}
                placeholder="Cantidad de productos en el lote"
              />
            </Form.Item>
          </Form>
        </StyledContainer>
      </Modal>
    </>
  );
};
