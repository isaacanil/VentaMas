import { Form, Input, Button, Modal, Spin, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  clearRowShelfForm,
  closeRowShelfForm,
  selectRowShelfState,
  setRowShelfError,
  setRowShelfLoading,
} from '@/features/warehouse/rowShelfModalSlice';
import {
  createRowShelf,
  updateRowShelf,
} from '@/firebase/warehouse/RowShelfService';
import type { InventoryUser } from '@/utils/inventory/types';

const toId = (node: Record<string, unknown> | undefined): string | null => {
  const value = node?.id;
  return typeof value === 'string' && value ? value : null;
};

const resolveRowShelfSaveMessage = (isUpdatingRowShelf: boolean) =>
  isUpdatingRowShelf
    ? 'Fila de estante actualizada con éxito.'
    : 'Fila de estante creada con éxito.';

const resolveRowShelfErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Error al guardar la fila de estante.';

type RowShelfState = ReturnType<typeof selectRowShelfState>;

type RowShelfFormValues = RowShelfState['formData'] & {
  capacity?: number | string;
};

type RowShelfFormProps = {
  visible?: boolean;
  onClose?: () => void;
  shelfId?: string;
};

export default function RowShelfForm(_props: RowShelfFormProps) {
  const [form] = Form.useForm<RowShelfFormValues>();
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as InventoryUser | null;
  const { formData, isOpen, path, loading } = useSelector(
    selectRowShelfState,
  ) as RowShelfState;

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

  const handleFinish = async (values: RowShelfFormValues) => {
    dispatch(setRowShelfError(null));
    dispatch(setRowShelfLoading(true));

    const warehouseId = toId(path[0]);
    const shelfId = toId(path[1]);
    if (!warehouseId || !shelfId) {
      const errorMessage = 'No se encontró el contexto completo de ubicación';
      message.error(errorMessage);
      dispatch(setRowShelfError(errorMessage));
      dispatch(setRowShelfLoading(false));
      return;
    }

    const parsedCapacity = Number(values.capacity ?? 0);
    const newRowShelf = {
      ...formData,
      ...values,
      capacity: Number.isFinite(parsedCapacity) ? parsedCapacity : 0,
      warehouseId,
      shelfId,
    };
    const isUpdatingRowShelf = Boolean(formData?.id);
    const saveRowShelf = isUpdatingRowShelf
      ? () =>
          updateRowShelf(user, warehouseId, shelfId, formData.id as string, newRowShelf)
      : () => createRowShelf(user, warehouseId, shelfId, newRowShelf);
    const successMessage = resolveRowShelfSaveMessage(isUpdatingRowShelf);

    try {
      await saveRowShelf();
      message.success(successMessage);

      handleClose();
    } catch (error) {
      const errorMessage = resolveRowShelfErrorMessage(error);
      console.error('Error al guardar la fila de estante: ', error);
      message.error(errorMessage);
      dispatch(setRowShelfError(errorMessage));
    }
    dispatch(setRowShelfLoading(false));
  };

  const handleClose = () => {
    dispatch(clearRowShelfForm());
    dispatch(closeRowShelfForm());
    form.resetFields();
  };

  return (
    <Modal
      title={formData?.id ? 'Editar Fila de Estante' : 'Añadir Fila de Estante'}
      open={isOpen}
      onCancel={handleClose}
      afterOpenChange={handleAfterOpenChange}
      footer={null}
      destroyOnClose
    >
      <Spin
        spinning={loading}
        tip={formData?.id ? 'Actualizando fila...' : 'Creando fila...'}
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
          <Form.Item name="shortName" label="Nombre Corto">
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
              Guardar
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
