import { Button, Modal } from 'antd';
import type { ButtonProps } from 'antd';

const VALID_BUTTON_TYPES: Array<NonNullable<ButtonProps['type']>> = [
  'default',
  'primary',
  'dashed',
  'link',
  'text',
];

type ConfirmModalProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  danger?: boolean;
  type?: ButtonProps['type'] | 'danger';
  confirmText?: string;
  cancelText?: string;
};

export const ConfirmModal = ({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  danger = false,
  type: buttonType,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}: ConfirmModalProps) => {
  const resolvedButtonType: ButtonProps['type'] =
    !buttonType ||
    buttonType === 'danger' ||
    !VALID_BUTTON_TYPES.includes(buttonType)
      ? 'primary'
      : buttonType;
  const resolvedDanger = danger || buttonType === 'danger';

  return (
    <Modal
      title={title}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText}
        </Button>,
        <Button
          key="confirm"
          danger={resolvedDanger}
          type={resolvedButtonType}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>,
      ]}
    >
      <p
        style={{
          minHeight: '100px',
          maxWidth: '400px',
          margin: '0 10px',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {message}
      </p>
    </Modal>
  );
};
