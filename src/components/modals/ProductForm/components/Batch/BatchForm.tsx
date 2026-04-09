import {
  CalendarOutlined,
  EditOutlined,
  PlusOutlined,
} from '@/constants/icons/antd';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { selectUpdateProductData } from '@/features/updateProduct/updateProductSlice';
import { createBatch, updateBatch } from '@/firebase/warehouse/batchService';
import type { Batch } from '@/models/Warehouse/Batch';
import type { ProductRecord } from '@/types/products';
import { convertDayjsToTimestamp, toMillis } from '@/utils/date/dateUtils';
import type { TimestampLike } from '@/utils/date/types';
import type { InventoryUser } from '@/utils/inventory/types';

// Styled Components
const StyledContainer = styled.div`
  padding: 16px;
`;

type BatchFormMode = 'create' | 'update';

type BatchFormData = Partial<Batch> & {
  expirationDate?: TimestampLike;
  manufacturingDate?: TimestampLike;
  receivedDate?: TimestampLike;
} & Record<string, unknown>;

type BatchFormValues = {
  shortName?: string;
  quantity?: number;
  notes?: string;
  expirationDate?: Dayjs | null;
  manufacturingDate?: Dayjs | null;
  receivedDate?: Dayjs | null;
};

type BatchFormProps = {
  initialData?: BatchFormData | null;
  mode?: BatchFormMode;
  justIcon?: boolean;
};

const toDayjsValue = (val: TimestampLike | null | undefined) => {
  const ms = toMillis(val);
  return typeof ms === 'number' ? dayjs(ms) : null;
};

export const BatchForm = ({
  initialData,
  mode = 'create',
  justIcon = false,
}: BatchFormProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm<BatchFormValues>();
  const [loading, setLoading] = useState(false);
  const user = useSelector(selectUser) as InventoryUser | null;
  const { product } = useSelector(selectUpdateProductData) as {
    product: ProductRecord | null;
  };
  const convertedData: BatchFormValues = {
    shortName: initialData?.shortName ?? '',
    quantity:
      typeof initialData?.quantity === 'number'
        ? initialData.quantity
        : undefined,
    notes: initialData?.notes ?? '',
    expirationDate: toDayjsValue(initialData?.expirationDate),
    manufacturingDate: toDayjsValue(initialData?.manufacturingDate),
    receivedDate: toDayjsValue(initialData?.receivedDate),
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

  const onFinish = (values: BatchFormValues) => {
    if (!user?.businessID) {
      notification.error({
        message: 'Usuario inválido',
        description: 'No se encontró un negocio asociado para crear el lote.',
      });
      return;
    }

    const batchData = {
      ...initialData,
      ...values,
      notes: values?.notes || '',
      productId: product?.id,
      expirationDate: convertDayjsToTimestamp(values?.expirationDate),
      manufacturingDate: convertDayjsToTimestamp(values?.manufacturingDate),
      receivedDate: convertDayjsToTimestamp(values?.receivedDate),
    };

    const submitPromise =
      mode === 'create'
        ? createBatch(user, batchData).then(() => {
            notification.success({
              message: 'Lote Creado',
              description: 'El lote ha sido creado exitosamente.',
            });
          })
        : !batchData.id
          ? (() => {
              notification.error({
                message: 'Error',
                description: 'No se encontró el ID del lote a actualizar.',
              });
              return Promise.resolve(false);
            })()
          : updateBatch(user, { ...batchData, id: String(batchData.id) }).then(
              () => {
                notification.success({
                  message: 'Lote Actualizado',
                  description: 'El lote ha sido actualizado exitosamente.',
                });
                return true;
              },
            );

    void submitPromise.then(
      (shouldClose) => {
        if (shouldClose !== false) {
          setIsModalVisible(false);
          form.resetFields();
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error al procesar el lote:', error);
        notification.error({
          message: 'Error',
          description:
            'Ocurrió un error al procesar el lote. Por favor, intenta nuevamente.',
        });
        setLoading(false);
      },
    );
  };

  const onFinishFailed = () => {
    notification.error({
      message: 'Error al Crear/Editar Lote',
      description: 'Por favor, revisa los errores en el formulario.',
    });
  };

  const disablePastDates = (current: Dayjs | null) =>
    Boolean(current && current.isBefore(dayjs().startOf('day'), 'day'));

  return (
    <>
      <Button
        icon={initialData ? <EditOutlined /> : <PlusOutlined />}
        onClick={showModal}
        type={mode === 'create' ? 'primary' : 'default'}
      >
        {!justIcon && (initialData ? 'Editar Lote' : 'Crear Lote')}
      </Button>
      <Modal
        title={initialData ? 'Editar Lote' : 'Crear Nuevo Lote'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={initialData ? 'Editar' : 'Crear'}
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
              label={'Nombre corto'}
              name="shortName"
              help="Ingrese un nombre corto para identificar el Lote."
              rules={[
                {
                  required: true,
                  message: 'El nombre corto es obligatorio.',
                },
                {
                  min: 2,
                  message: 'El nombre corto debe tener al menos 2 caracteres.',
                },
              ]}
            >
              <Input placeholder="Nombre corto del lote" />
            </Form.Item>

            {/* Fecha de expiración */}
            <Form.Item
              label={'Fecha de Expiración (opcional)'}
              name="expirationDate"
              help="Seleccione una fecha de expiración."
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                placeholder="Seleccione una fecha"
                suffixIcon={<CalendarOutlined />}
                disabledDate={disablePastDates}
              />
            </Form.Item>

            <Form.Item
              label={'Cantidad'}
              name="quantity"
              help="Ingrese la cantidad total de productos en el lote."
              rules={[
                {
                  required: true,
                  message: 'La cantidad es obligatoria.',
                },
                {
                  type: 'number',
                  min: 1,
                  message: 'La cantidad debe ser al menos 1.',
                },
              ]}
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
                placeholder="Cantidad de productos en el lote"
              />
            </Form.Item>
          </Form>
        </StyledContainer>
      </Modal>
    </>
  );
};
