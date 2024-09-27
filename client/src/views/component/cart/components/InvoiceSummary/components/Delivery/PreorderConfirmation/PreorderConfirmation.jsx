// PreorderConfirmation.jsx
import React from 'react';
import * as antd from 'antd';
const { Modal } = antd;
export const PreorderConfirmation = ({ open, onConfirm, onCancel, preorder }) => {

  return (
    <Modal
      title="Confirmar Preorden"
      open={open}
      onOk={() => onConfirm(preorder.data.numberID)}
      onCancel={onCancel}
      okText="Completar"
      cancelText="Cancelar"
    >
      <p>¿Estás seguro de que deseas completar la preorden <strong>{preorder.data.preorderDetails.numberID}</strong> para el cliente <strong>{preorder?.data?.client?.name}</strong>?</p>
    </Modal>
  );
};
