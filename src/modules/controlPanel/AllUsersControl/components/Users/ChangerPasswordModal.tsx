import { Form, Input, Modal, Typography, message } from 'antd';
import { useCallback, useState } from 'react';

import { fbUpdateUserPassword } from '@/firebase/Auth/fbAuthV2/fbUpdateUserPassword';
import { PASSWORD_STRENGTH_RULE } from '@/utils/formRules';

import type { FC } from 'react';
import type { UserRow } from './TableUser';

interface ChangePasswordFormValues {
  password: string;
}

interface ChangerPasswordModalProps {
  isOpen: boolean;
  data?: UserRow | null;
  onClose?: () => void;
}

const getErrorMessage = (error: unknown): string | null => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return null;
};

export const ChangerPasswordModal: FC<ChangerPasswordModalProps> = ({
  isOpen,
  data,
  onClose,
}) => {
  const [form] = Form.useForm<ChangePasswordFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = useCallback(() => {
    form.resetFields();
    onClose?.();
  }, [form, onClose]);

  const handleFinish = useCallback(
    async ({ password }: ChangePasswordFormValues) => {
      const userId = data?.id ?? null;
      if (!userId) {
        message.error('No se pudo identificar al usuario seleccionado.');
        return;
      }

      setIsSubmitting(true);
      let updateError: unknown = null;

      try {
        await fbUpdateUserPassword(userId, password);
      } catch (error: unknown) {
        updateError = error;
      }

      setIsSubmitting(false);

      if (updateError) {
        message.error(
          getErrorMessage(updateError) || 'Error actualizando la contraseña',
        );
        return;
      }

      message.success('Contraseña actualizada correctamente');
      closeModal();
    },
    [closeModal, data?.id],
  );

  const handleCancel = useCallback(() => {
    closeModal();
  }, [closeModal]);

  return (
    <Modal
      title="Editar Contraseña"
      open={isOpen}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={isSubmitting}
      okText="Guardar"
      cancelText="Cancelar"
    >
      <Form
        form={form}
        layout="vertical"
        name="editPasswordForm"
        onFinish={handleFinish}
      >
        <Typography.Title level={5}>Editar Contraseña</Typography.Title>
        <Form.Item label="Usuario">
          <Input value={data?.name ?? ''} disabled />
        </Form.Item>
        <Form.Item
          label="Nueva Contraseña"
          name="password"
          rules={PASSWORD_STRENGTH_RULE}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
