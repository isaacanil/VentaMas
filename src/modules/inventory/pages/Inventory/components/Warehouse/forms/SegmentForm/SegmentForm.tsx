import { Form, Input, Button, Modal, Spin, message } from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  clearSegmentForm,
  closeSegmentForm,
  selectSegmentState,
  setSegmentError,
  setSegmentLoading,
} from '@/features/warehouse/segmentModalSlice';
import {
  createSegment,
  updateSegment,
} from '@/firebase/warehouse/segmentService';
import type { InventoryUser } from '@/utils/inventory/types';

const toId = (node: Record<string, unknown> | undefined): string | null => {
  const value = node?.id;
  return typeof value === 'string' && value ? value : null;
};

type SegmentState = ReturnType<typeof selectSegmentState>;

type SegmentFormValues = SegmentState['formData'] & {
  capacity?: number | string;
};

type SegmentFormProps = {
  visible?: boolean;
  onClose?: () => void;
  rowId?: string;
};

export default function SegmentForm(_props: SegmentFormProps) {
  const dispatch = useDispatch();
  const [form] = Form.useForm<SegmentFormValues>();
  const { formData, isOpen, path, loading } = useSelector(
    selectSegmentState,
  ) as SegmentState;
  const user = useSelector(selectUser) as InventoryUser | null;

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

  const handleFinish = async (values: SegmentFormValues) => {
    try {
      dispatch(setSegmentError(null));
      dispatch(setSegmentLoading(true));

      const warehouseId = toId(path[0]);
      const shelfId = toId(path[1]);
      const rowShelfId = toId(path[2]);
      if (!warehouseId || !shelfId || !rowShelfId) {
        throw new Error('No se encontró el contexto completo de ubicación');
      }

      const parsedCapacity = Number(values.capacity ?? 0);
      const sanitizedSegment = {
        ...formData,
        ...values,
        capacity: Number.isFinite(parsedCapacity) ? parsedCapacity : 0,
        warehouseId,
        shelfId,
        rowShelfId,
      };

      if (formData?.id) {
        await updateSegment(user, sanitizedSegment);
        message.success('Segmento actualizado con éxito.');
      } else {
        const payload = { ...sanitizedSegment };
        delete payload.id;
        await createSegment({
          user,
          segmentData: payload,
        });
        message.success('Segmento creado con éxito.');
      }

      handleClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al guardar el segmento.';
      console.error('Error al guardar el segmento:', error);
      message.error(errorMessage);
      dispatch(setSegmentError(errorMessage));
    } finally {
      dispatch(setSegmentLoading(false));
    }
  };

  const handleClose = () => {
    dispatch(clearSegmentForm());
    dispatch(closeSegmentForm());
    form.resetFields();
  };

  return (
    <Modal
      title={formData?.id ? 'Editar Segmento' : 'Añadir Segmento'}
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
    >
      <Spin
        spinning={loading}
        tip={formData?.id ? 'Actualizando segmento...' : 'Creando segmento...'}
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
            rules={[{ required: true, message: 'Por favor, ingrese el nombre' }]}
          >
            <Input disabled={loading} />
          </Form.Item>
          <Form.Item
            name="shortName"
            label="Nombre Corto"
            rules={[{
              required: true,
              message: 'Por favor, ingrese el nombre corto',
            }]}
          >
            <Input disabled={loading} />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea disabled={loading} />
          </Form.Item>
          <Form.Item
            name="capacity"
            label="Capacidad"
            rules={[{
              required: true,
              message: 'Por favor, ingrese la capacidad',
            }]}
          >
            <Input type="number" min="0" disabled={loading} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {formData?.id ? 'Actualizar' : 'Crear'}
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
