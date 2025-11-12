import { Form, Input, Modal, Typography, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';

import { fbUpdateUserPassword } from '../../../../../../../firebase/Auth/fbAuthV2/fbUpdateUserPassword';

const PASSWORD_RULES = [
  { required: true, message: 'Por favor ingresa la nueva contraseña.' },
  { min: 8, message: 'Debe tener al menos 8 caracteres.' },
  {
    pattern: /(?=.*[A-Z])/,
    message: 'Incluye al menos una letra mayúscula.',
  },
  {
    pattern: /(?=.*[a-z])/,
    message: 'Incluye al menos una letra minúscula.',
  },
  {
    pattern: /(?=.*\\d)/,
    message: 'Incluye al menos un número.',
  },
];

export const ChangeUserPasswordModal = ({ isOpen, user, onClose }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const username = useMemo(
    () => user?.name ?? user?.username ?? '',
    [user?.name, user?.username],
  );
  const realName = useMemo(() => user?.realName ?? '', [user?.realName]);
  const displayName = (realName || username || 'Usuario sin nombre').trim();

  const resetAndClose = useCallback(() => {
    form.resetFields();
    onClose?.();
  }, [form, onClose]);

  const handleSubmit = useCallback(
    async ({ password }) => {
      if (!user?.id) {
        message.error('No se pudo identificar al usuario seleccionado.');
        return;
      }

      setIsSubmitting(true);

      try {
        await fbUpdateUserPassword(user.id, password);
        message.success('Contraseña actualizada correctamente.');
        resetAndClose();
      } catch (error) {
        message.error(error?.message || 'Error al actualizar la contraseña.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [resetAndClose, user?.id],
  );

  const handleCancel = useCallback(() => {
    if (isSubmitting) return;
    resetAndClose();
  }, [isSubmitting, resetAndClose]);

  return (
    <Modal
      open={isOpen}
      title={`Cambiar contraseña de ${displayName}`}
      okText="Guardar"
      cancelText="Cancelar"
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={isSubmitting}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Typography.Title level={5}>Asignar nueva contraseña</Typography.Title>
        <Form.Item label="Usuario">
          <Input value={username || displayName} disabled />
        </Form.Item>
        {realName && realName !== username && (
          <Typography.Text type="secondary">Nombre: {realName}</Typography.Text>
        )}
        <Form.Item
          label="Nueva contraseña"
          name="password"
          rules={PASSWORD_RULES}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="Confirmar contraseña"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Confirma la nueva contraseña.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('Las contraseñas no coinciden.'),
                );
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
