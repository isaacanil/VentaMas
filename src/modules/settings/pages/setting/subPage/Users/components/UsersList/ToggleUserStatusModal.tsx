import { Alert, Modal, Typography, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';

import { fbUpdateUser } from '@/firebase/Auth/fbAuthV2/fbUpdateUser';
import type { UserIdentity } from '@/types/users';

type ToggleUserStatusModalUser = UserIdentity & {
  active?: boolean;
};

interface ToggleUserStatusModalProps {
  isOpen: boolean;
  user?: ToggleUserStatusModalUser | null;
  onClose?: () => void;
}

export const ToggleUserStatusModal = ({
  isOpen,
  user,
  onClose,
}: ToggleUserStatusModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isActive = Boolean(user?.active);
  const nextStatus = !isActive;

  const statusLabel = nextStatus ? 'activar' : 'desactivar';
  const modalTitle = `${nextStatus ? 'Activar' : 'Desactivar'} usuario`;

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose?.();
  }, [isSubmitting, onClose]);

  const handleConfirm = useCallback(() => {
    if (!user?.id) {
      message.error('No se pudo identificar al usuario seleccionado.');
      return;
    }

    setIsSubmitting(true);

    void fbUpdateUser({ ...user, active: nextStatus }).then(
      () => {
        message.success(
          `Usuario ${nextStatus ? 'activado' : 'desactivado'} correctamente.`,
        );
        onClose?.();
        setIsSubmitting(false);
      },
      (error) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error al actualizar el estado del usuario.';
        message.error(errorMessage);
        setIsSubmitting(false);
      },
    );
  }, [nextStatus, onClose, user]);

  const alertDescription = isActive
    ? 'El usuario perderá acceso a la plataforma hasta que sea reactivado.'
    : 'El usuario podrá iniciar sesión y utilizar la plataforma nuevamente.';

  return (
    <Modal
      title={modalTitle}
      open={isOpen}
      onCancel={handleClose}
      onOk={handleConfirm}
      okText={nextStatus ? 'Activar' : 'Desactivar'}
      cancelText="Cancelar"
      confirmLoading={isSubmitting}
      okButtonProps={{ danger: !nextStatus }}
    >
      <Typography.Paragraph>
        ¿Deseas {statusLabel} al usuario{' '}
        <Typography.Text strong>{user?.name ?? 'sin nombre'}</Typography.Text>?
      </Typography.Paragraph>
      <Alert
        showIcon
        type={nextStatus ? 'info' : 'warning'}
        message={`El usuario quedará ${nextStatus ? 'activo' : 'inactivo'}.`}
        description={alertDescription}
      />
    </Modal>
  );
};
