import { Form, Input, Button, Modal, Spin, message } from 'antd';
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

const resolveSegmentSaveMessage = (isUpdatingSegment: boolean) =>
  isUpdatingSegment
    ? 'Segmento actualizado con éxito.'
    : 'Segmento creado con éxito.';

const resolveSegmentErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Error al guardar el segmento.';

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

  const handleAfterOpenChange = (open: boolean) => {
    if (open) {
      if (formData?.id) {
        form.setFieldsValue(formData);
        return;
      }

      form.resetFields();
      return;
    }

    form.resetFields();
  };

  const handleFinish = async (values: SegmentFormValues) => {
    if (!user) {
      const errorMessage = 'No se encontró información del usuario';
      message.error(errorMessage);
      dispatch(setSegmentError(errorMessage));
      return;
    }

    dispatch(setSegmentError(null));
    dispatch(setSegmentLoading(true));

    const warehouseId = toId(path[0]);
    const shelfId = toId(path[1]);
    const rowShelfId = toId(path[2]);
    if (!warehouseId || !shelfId || !rowShelfId) {
      const errorMessage = 'No se encontró el contexto completo de ubicación';
      message.error(errorMessage);
      dispatch(setSegmentError(errorMessage));
      dispatch(setSegmentLoading(false));
      return;
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
    const isUpdatingSegment = Boolean(formData?.id);
    const saveSegment = isUpdatingSegment
      ? () => updateSegment(user, sanitizedSegment as any)
      : () => {
          const { id: _id, ...payload } = sanitizedSegment;
          return createSegment({
            user,
            segmentData: payload,
          });
        };
    const successMessage = resolveSegmentSaveMessage(isUpdatingSegment);

    try {
      await saveSegment();
      message.success(successMessage);

      handleClose();
    } catch (error) {
      const errorMessage = resolveSegmentErrorMessage(error);
      console.error('Error al guardar el segmento:', error);
      message.error(errorMessage);
      dispatch(setSegmentError(errorMessage));
    }
    dispatch(setSegmentLoading(false));
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
      afterOpenChange={handleAfterOpenChange}
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
            rules={[
              { required: true, message: 'Por favor, ingrese el nombre' },
            ]}
          >
            <Input disabled={loading} />
          </Form.Item>
          <Form.Item
            name="shortName"
            label="Nombre Corto"
            rules={[
              {
                required: true,
                message: 'Por favor, ingrese el nombre corto',
              },
            ]}
          >
            <Input disabled={loading} />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea disabled={loading} />
          </Form.Item>
          <Form.Item
            name="capacity"
            label="Capacidad"
            rules={[
              {
                required: true,
                message: 'Por favor, ingrese la capacidad',
              },
            ]}
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
