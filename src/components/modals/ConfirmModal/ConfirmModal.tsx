// ConfirmModal.tsx
import { Modal, Button } from 'antd';
import type { ButtonProps } from 'antd';
import React from 'react';

const VALID_BUTTON_TYPES: Array<NonNullable<ButtonProps['type']>> = [
  'default',
  'primary',
  'dashed',
  'link',
  'text',
];

type ConfirmModalProps<T = unknown> = {
  open: boolean;
  onConfirm: (data?: T) => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  danger?: boolean;
  type?: ButtonProps['type'] | 'danger';
  confirmText?: string;
  cancelText?: string;
  data?: T;
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
  data,
}: ConfirmModalProps) => {
  const getButtonType = (): ButtonProps['type'] => {
    if (!buttonType || buttonType === 'danger') return 'primary';
    return VALID_BUTTON_TYPES.includes(buttonType) ? buttonType : 'primary';
  };
  const resolvedDanger = danger || buttonType === 'danger';

  return (
    <Modal
      title={title}
      open={open}
      onOk={() => onConfirm(data)}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText}
        </Button>,
        <Button
          key="confirm"
          danger={resolvedDanger}
          type={getButtonType()}
          onClick={() => onConfirm(data)}
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
