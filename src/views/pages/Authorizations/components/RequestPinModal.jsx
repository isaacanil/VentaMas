import { KeyOutlined } from '@ant-design/icons';
import { Modal, Form, Input, message } from 'antd';
import { useState } from 'react';

const { TextArea } = Input;

/**
 * Modal para que usuarios normales soliciten PIN a un admin
 * (Opcionalmente puede enviar una notificación o crear un ticket)
 */
export const RequestPinModal = ({ visible, onClose, hasCurrentPin }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setSubmitting(true);

      // TODO: Implementar sistema de notificaciones/tickets
      // Por ahora solo mostramos mensaje

      message.success(
        hasCurrentPin
          ? 'Solicitud enviada. Un administrador regenerará el PIN pronto.'
          : 'Solicitud enviada. Un administrador configurará el PIN pronto.'
      );

      form.resetFields();
      onClose();
    } catch {
      // Validation error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      title={
        <span>
          <KeyOutlined /> {hasCurrentPin ? 'Solicitar Regeneración de PIN' : 'Solicitar PIN'}
        </span>
      }
      okText="Enviar Solicitud"
      cancelText="Cancelar"
      width={500}
    >
      <div style={{ marginBottom: 16 }}>
        <p>
          {hasCurrentPin
            ? 'El PIN actual ha expirado o está inactivo. Solicita a un administrador que genere uno nuevo.'
            : 'No tienes PINs configurados. Solicita a un administrador que genere uno para ti.'}
        </p>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Motivo (opcional)"
          rules={[{ max: 200, message: 'Máximo 200 caracteres' }]}
        >
          <TextArea
            rows={3}
            placeholder={
              hasCurrentPin
                ? 'Ej: El PIN expiró y lo necesito para aprobar operaciones'
                : 'Ej: Necesito un PIN para autorizar operaciones en mi turno'
            }
            maxLength={200}
          />
        </Form.Item>
      </Form>

      <p style={{ fontSize: '0.9em', color: '#8c8c8c', marginTop: 16 }}>
        Un administrador recibirá tu solicitud y configurará el PIN. Te notificaremos cuando esté listo.
      </p>
    </Modal>
  );
};

export default RequestPinModal;
