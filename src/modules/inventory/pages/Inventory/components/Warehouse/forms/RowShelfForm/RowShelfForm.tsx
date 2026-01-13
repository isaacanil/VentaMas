import { Form, Input, Button, Modal, Spin, message } from 'antd';
import { useEffect } from 'react';
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

  const handleFinish = async (values: RowShelfFormValues) => {
    try {
      dispatch(setRowShelfError(null));
      dispatch(setRowShelfLoading(true));

      const warehouseId = toId(path[0]);
      const shelfId = toId(path[1]);
      if (!warehouseId || !shelfId) {
        throw new Error('No se encontró el contexto completo de ubicación');
      }

      const parsedCapacity = Number(values.capacity ?? 0);
      const newRowShelf = {
        ...formData,
        ...values,
        capacity: Number.isFinite(parsedCapacity) ? parsedCapacity : 0,
        warehouseId,
        shelfId,
      };

      if (formData?.id) {
        await updateRowShelf(
          user,
          warehouseId,
          shelfId,
          formData.id,
          newRowShelf,
        );
        message.success('Fila de estante actualizada con éxito.');
      } else {
        await createRowShelf(user, warehouseId, shelfId, newRowShelf);
        message.success('Fila de estante creada con éxito.');
      }

      handleClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al guardar la fila de estante.';
      console.error('Error al guardar la fila de estante: ', error);
      message.error(errorMessage);
      dispatch(setRowShelfError(errorMessage));
    } finally {
      dispatch(setRowShelfLoading(false));
    }
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
            rules={[{ required: true, message: 'Por favor, ingrese el nombre' }]}
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
            rules={[{
              required: true,
              message: 'Por favor, ingrese la capacidad',
            }]}
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
