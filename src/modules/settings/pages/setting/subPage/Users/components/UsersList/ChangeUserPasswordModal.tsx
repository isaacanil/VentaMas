import { Form, Input, Modal, Typography, message } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';

import { fbUpdateUserPassword } from '@/firebase/Auth/fbAuthV2/fbUpdateUserPassword';

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
    pattern: /(?=.*\d)/,
    message: 'Incluye al menos un número.',
  },
];

interface ChangePasswordUser {
  id?: string;
  name?: string;
  username?: string;
  realName?: string;
}

interface ChangePasswordFormValues {
  password: string;
  confirmPassword: string;
}

const PASSWORD_FORM_FIELDS: Array<keyof ChangePasswordFormValues> = [
  'password',
  'confirmPassword',
];

interface ChangeUserPasswordModalProps {
  isOpen: boolean;
  user?: ChangePasswordUser | null;
  onClose?: () => void;
}

export const ChangeUserPasswordModal = ({
  isOpen,
  user,
  onClose,
}: ChangeUserPasswordModalProps) => {
  const [form] = Form.useForm<ChangePasswordFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canSubmitPasswordForm, setCanSubmitPasswordForm] = useState(false);
  const validationRunRef = useRef(0);

  const username = useMemo(
    () => user?.name ?? user?.username ?? '',
    [user?.name, user?.username],
  );
  const realName = useMemo(() => user?.realName ?? '', [user?.realName]);
  const displayName = (realName || username || 'Usuario sin nombre').trim();

  const updatePasswordFormValidity = useCallback(() => {
    const validationRun = validationRunRef.current + 1;
    validationRunRef.current = validationRun;

    const values = form.getFieldsValue(PASSWORD_FORM_FIELDS);
    const hasRequiredValues = PASSWORD_FORM_FIELDS.every((fieldName) =>
      Boolean(values[fieldName]),
    );

    if (!hasRequiredValues) {
      setCanSubmitPasswordForm(false);
      return;
    }

    void form
      .validateFields(PASSWORD_FORM_FIELDS, { validateOnly: true })
      .then(
        () => {
          if (validationRunRef.current === validationRun) {
            setCanSubmitPasswordForm(true);
          }
        },
        () => {
          if (validationRunRef.current === validationRun) {
            setCanSubmitPasswordForm(false);
          }
        },
      );
  }, [form]);

  const resetAndClose = useCallback(() => {
    validationRunRef.current += 1;
    form.resetFields();
    setCanSubmitPasswordForm(false);
    onClose?.();
  }, [form, onClose]);

  const handleSubmit = useCallback(
    ({ password }: ChangePasswordFormValues) => {
      if (!user?.id) {
        message.error('No se pudo identificar al usuario seleccionado.');
        return;
      }

      setIsSubmitting(true);

      void fbUpdateUserPassword(user.id, password).then(
        () => {
          message.success('Contraseña actualizada correctamente.');
          resetAndClose();
          setIsSubmitting(false);
        },
        (error) => {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Error al actualizar la contraseña.';
          message.error(errorMessage);
          setIsSubmitting(false);
        },
      );
    },
    [resetAndClose, user],
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
      okButtonProps={{ disabled: !canSubmitPasswordForm || isSubmitting }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={updatePasswordFormValidity}
      >
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
          <Input.Password
            autoComplete="new-password"
            onPressEnter={() => form.submit()}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
