import { Modal, Input, Button, Form, Typography, Alert } from 'antd';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const { TextArea } = Input;
const { Text } = Typography;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ConfirmationLabel = styled(Text)`
  margin-bottom: 8px;
  display: block;
`;

const ConfirmationCode = styled.strong`
  color: #ff4d4f;
  margin-left: 4px;
`;

export const CancelModal = ({
  isOpen,
  onClose,
  onConfirm,
  config = {
    title: 'Confirmar Cancelación',
    confirmButtonText: 'Confirmar Cancelación',
    cancelButtonText: 'Cancelar',
    requireConfirmationCode: true,
    showTextArea: true,
    alertMessage: 'Esta acción no se puede deshacer',
    alertType: 'warning', // 'warning' | 'error' | 'info'
  },
}) => {
  const generateNumericCode = (length = 4) => {
    return Math.random()
      .toString()
      .slice(2, 2 + length);
  };

  const [form] = Form.useForm();
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);

  useEffect(() => {
    if (isOpen && config.requireConfirmationCode) {
      setConfirmCode(generateNumericCode(4));
      setIsValidCode(false);
    }
    form.resetFields();
  }, [isOpen, form, config.requireConfirmationCode]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      if (
        !config.requireConfirmationCode ||
        values.confirmationCode === confirmCode
      ) {
        await onConfirm(values.cancelReason);
        handleClose();
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value;
    setIsValidCode(value === confirmCode);
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={config.title}
      open={isOpen}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          {config.cancelButtonText}
        </Button>,
        <Button
          key="confirm"
          danger
          type="primary"
          onClick={handleConfirm}
          loading={loading}
          disabled={config.requireConfirmationCode && !isValidCode}
        >
          {config.confirmButtonText}
        </Button>,
      ]}
    >
      <Container>
        <Alert message={config.alertMessage} type={config.alertType} showIcon />

        <StyledForm form={form} layout="vertical">
          {config.requireConfirmationCode && (
            <Form.Item
              name="confirmationCode"
              label={
                <ConfirmationLabel>
                  Ingrese el siguiente código para confirmar:
                  <ConfirmationCode>{confirmCode}</ConfirmationCode>
                </ConfirmationLabel>
              }
              rules={[
                {
                  required: true,
                  message: 'El código de confirmación es obligatorio',
                },
                () => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    return value === confirmCode
                      ? Promise.resolve()
                      : Promise.reject(
                          'El código de confirmación es incorrecto',
                        );
                  },
                }),
              ]}
            >
              <Input
                type="number"
                placeholder="Ingrese el código de confirmación"
                onChange={handleCodeChange}
              />
            </Form.Item>
          )}

          {config.showTextArea && (
            <Form.Item
              name="cancelReason"
              label={<Text>Motivo de la cancelación (opcional)</Text>}
            >
              <TextArea
                rows={4}
                placeholder="Describa el motivo de la cancelación"
              />
            </Form.Item>
          )}
        </StyledForm>
      </Container>
    </Modal>
  );
};
