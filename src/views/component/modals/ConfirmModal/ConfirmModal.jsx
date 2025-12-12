// ConfirmModal.jsx
import { Modal, Button } from 'antd';
import React from 'react';

const VALID_BUTTON_TYPES = new Set([
  'default',
  'primary',
  'dashed',
  'link',
  'text',
  'ghost',
]);

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
}) => {
  const getButtonType = () =>
    buttonType && VALID_BUTTON_TYPES.has(buttonType) ? buttonType : 'primary';
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
