import { Input, InputNumber, Form, Spin, Modal, message } from 'antd';
import type { FormInstance } from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  selectWarehouseModalState,
  closeWarehouseForm,
  setWarehouseLoading,
  setWarehouseError,
} from '@/features/warehouse/warehouseModalSlice';
import {
  createWarehouse,
  updateWarehouse,
} from '@/firebase/warehouse/warehouseService';
import type { InventoryUser } from '@/utils/inventory/types';

import { WarehouseDimensionFields } from './components/WarehouseDimensionFields';
import {
  buildWarehousePayload,
  getWarehouseFormInitialValues,
} from './WarehouseForm.helpers';
import {
  CardDescription,
  FormContainer,
  StyledButton,
} from './WarehouseForm.styles';
import type {
  WarehouseFormData,
  WarehouseFormState,
} from './WarehouseForm.types';

const resolveWarehouseSaveMessage = (isUpdatingWarehouse: boolean) =>
  `Almacén ${isUpdatingWarehouse ? 'actualizado' : 'creado'} correctamente`;

const resolveWarehouseErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Ocurrió un error al procesar la solicitud.';

type WarehouseFormProps = {
  isOpen?: boolean;
  visible?: boolean;
  onClose?: () => void;
  initialData?: Record<string, unknown> | null;
};

export function WarehouseForm(_props: WarehouseFormProps) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as InventoryUser | null;
  const { isOpen, formData, loading } = useSelector(
    selectWarehouseModalState,
  ) as WarehouseFormState;
  const [form] = Form.useForm<WarehouseFormData>();

  const handleAfterOpenChange = (open: boolean) => {
    if (open) {
      const initialValues = getWarehouseFormInitialValues(formData);
      if (initialValues) {
        form.setFieldsValue(initialValues);
        return;
      }

      form.resetFields();
      return;
    }

    form.resetFields();
  };

  const handleSubmit = async () => {
    dispatch(setWarehouseError(null));
    await form.validateFields();
    const rawValues = form.getFieldsValue() as WarehouseFormData;

    const data = buildWarehousePayload(rawValues);
    const isUpdatingWarehouse = Boolean(formData?.id);
    const saveWarehouse = isUpdatingWarehouse
      ? () => updateWarehouse(user, formData.id as string, data)
      : () => createWarehouse(user, data);
    const successMessage = resolveWarehouseSaveMessage(isUpdatingWarehouse);

    dispatch(setWarehouseLoading(true));
    try {
      await saveWarehouse();
      handleClose();
      message.success(successMessage);
    } catch (error) {
      const errorMessage = resolveWarehouseErrorMessage(error);
      message.error('Ocurrió un error al procesar la solicitud.');
      dispatch(setWarehouseError(errorMessage));
      console.error('Ocurrió un error al procesar la solicitud.', error);
    }
    dispatch(setWarehouseLoading(false));
  };

  const handleClose = () => {
    dispatch(closeWarehouseForm());
    form.resetFields();
  };

  return (
    <Modal
      title={
        formData?.id
          ? 'Actualizar Información del Almacén'
          : 'Información del Almacén'
      }
      open={isOpen}
      onCancel={handleClose}
      afterOpenChange={handleAfterOpenChange}
      destroyOnClose
      footer={null}
    >
      <Spin
        description={
          formData?.id ? 'Actualizando almacén...' : 'Creando almacén...'
        }
        size="large"
        spinning={loading}
      >
        <CardDescription>
          {formData?.id
            ? 'Actualiza los detalles del almacén'
            : 'Introduce los detalles del nuevo almacén'}
        </CardDescription>
        <FormContainer
          form={form as FormInstance}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            label="Nombre"
            name="name"
            rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Nombre Corto"
            rules={[
              { required: true, message: 'Por favor ingresa el nombre corto' },
            ]}
            name="shortName"
          >
            <Input />
          </Form.Item>
          <Form.Item label="Descripción" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Propietario" name="owner">
            <Input />
          </Form.Item>
          <Form.Item
            label="Ubicación"
            name="location"
            rules={[
              { required: true, message: 'Por favor ingresa la ubicación' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Dirección" name="address">
            <Input />
          </Form.Item>

          <WarehouseDimensionFields />

          <Form.Item label="Capacidad (m³)" name="capacity">
            <InputNumber min={0} />
          </Form.Item>
          <StyledButton type="primary" htmlType="submit">
            {formData?.id ? 'Actualizar' : 'Enviar'}
          </StyledButton>
        </FormContainer>
      </Spin>
    </Modal>
  );
}
