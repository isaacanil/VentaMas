// ConfirmModal.jsx
import React from 'react';
import * as antd from 'antd';
const { Modal, Button } = antd;

export const ConfirmModal = ({ open, onConfirm, onCancel, title, message, danger = false, type, confirmText = "Confirmar", cancelText = "Cancelar", data }) => {
    const getButtonType = () => {
        switch (type) {
            case 'danger':
                return 'primary' && 'danger';
            case 'warning':
                return 'primary' && 'warning';
            default:
                return 'primary';
        }
    };
    return (
        <Modal
            title={title}
            open={open}
            onOk={() => onConfirm(data)}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>{cancelText}</Button>,
                <Button
                    key="confirm"
                    danger={danger}
                    type={getButtonType()}
                    onClick={() => onConfirm(data)}
                >{confirmText}</Button>,
            ]}
        >
            <p style={{
                minHeight: '100px',
                maxWidth: '400px',
                margin: "0 10px",
                display: "grid",
                placeItems: "center",
            }}>{message}</p>
        </Modal>
    );
};
