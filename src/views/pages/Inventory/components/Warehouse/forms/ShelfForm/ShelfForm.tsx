// @ts-nocheck
import { Form, Input, Button, Modal, Spin, message } from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  clearShelfForm,
  closeShelfForm,
  selectShelfState,
  setShelfError,
  setShelfLoading,
} from '@/features/warehouse/shelfModalSlice';
import {
  createShelf,
  updateShelf,
} from '@/firebase/warehouse/shelfService';
import type { InventoryUser } from '@/utils/inventory/types';

const toId = (node: Record<string, unknown> | undefined): string | null => {
  const value = node?.id;
  return typeof value === 'string' && value ? value : null;
};

type ShelfState = ReturnType<typeof selectShelfState>;

type ShelfFormValues = ShelfState['formData'] & {
  rowCapacity?: number | string;
};

type ShelfFormProps = {
  visible?: boolean;
  onClose?: () => void;
  warehouseId?: string;
};

export function ShelfForm(_props: ShelfFormProps) {
  const dispatch = useDispatch();
  const [form] = Form.useForm<ShelfFormValues>();
  const { formData, isOpen, path, loading } = useSelector(
    selectShelfState,
  ) as ShelfState;
  const user = useSelector(selectUser) as InventoryUser | null;

  useEffect(() => {
    if (isOpen) {
      if (formData?.id) {
        form.setFieldsValue(formData);
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, formData, form]);

  const handleFinish = async (values: ShelfFormValues) => {
    try {
      dispatch(setShelfError(null));
      dispatch(setShelfLoading(true));

      const parsedCapacity = Number(values.rowCapacity ?? 0);
      const newShelf = {
        ...formData,
        name: values.name?.trim() || '',
        shortName: values.shortName?.trim() || '',
        description: values.description?.trim() || '',
        rowCapacity: Number.isFinite(parsedCapacity) ? parsedCapacity : 0,
      };

      const warehouseId = toId(path[0]);
      if (!warehouseId) {
        throw new Error('No se encontró el ID del almacén');
      }

      if (formData?.id) {
        await updateShelf(user, warehouseId, newShelf);
        message.success('Estante actualizado con éxito.');
      } else {
        await createShelf(user, warehouseId, newShelf);
        message.success('Estante creado con éxito.');
      }
      handleClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al guardar el estante.';
      console.error('Error al guardar el estante: ', error);
      message.error(errorMessage);
      dispatch(setShelfError(errorMessage));
    } finally {
      dispatch(setShelfLoading(false));
    }
  };

  const handleClose = () => {
    dispatch(clearShelfForm());
    dispatch(closeShelfForm());
    form.resetFields();
  };

  return (
    <Modal
      title={formData?.id ? 'Editar Estante' : 'Añadir Estante'}
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
    >
      <Spin
        spinning={loading}
        tip={formData?.id ? 'Actualizando estante...' : 'Creando estante...'}
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
            name="rowCapacity"
            label="Capacidad de Fila"
            rules={[{
              required: true,
              message: 'Por favor, ingrese la capacidad de fila',
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
