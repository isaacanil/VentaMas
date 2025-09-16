import { useState } from 'react';
import { Modal, Button, Form, Input, Typography, Alert } from 'antd';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import { requestInvoiceEditAuthorization } from '../../../../firebase/authorizations/invoiceEditAuthorizations';

const { Paragraph } = Typography;

const ReasonsList = ({ reasons }) => (
  reasons?.length ? (
    <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 18 }}>
      {reasons.map((r, idx) => (
        <li key={idx} style={{ fontSize: 13 }}>{r}</li>
      ))}
    </ul>
  ) : null
);

export const RequestInvoiceEditAuthorization = ({
  isOpen,
  setIsOpen,
  invoice,
  reasons = [],
  onRequested,
}) => {
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCancel = () => {
    setIsOpen(false);
    setSubmitting(false);
    setResultMsg('');
    setErrorMsg('');
    form.resetFields();
  };

  const handleRequest = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      setResultMsg('');
      setErrorMsg('');
      const res = await requestInvoiceEditAuthorization(user, invoice, reasons, values.note || '');
      if (res?.alreadyPending) {
        setResultMsg('Ya existe una solicitud pendiente para esta factura.');
      } else {
        setResultMsg('Solicitud enviada. Un administrador la revisará.');
      }
      setSubmitting(false);
      if (onRequested) onRequested(res);
    } catch (e) {
      if (e?.errorFields) return; // validation
      setSubmitting(false);
      setErrorMsg(e?.message || 'Error enviando solicitud');
      console.log(e)
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleCancel}
      centered
      width={520}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={submitting}>Cancelar</Button>,
        <Button key="submit" type="primary" onClick={handleRequest} loading={submitting}>Solicitar</Button>,
      ]}
    >
      <div style={{ display: 'grid', gap: 10 }}>
        <Paragraph style={{ marginBottom: 4 }}>
          Se requiere autorización de un administrador para editar esta factura. Motivos:
        </Paragraph>
        <ReasonsList reasons={reasons} />
        <Form form={form} layout="vertical" autoComplete="off">
          <Form.Item name="note" label="Nota (opcional)">
            <Input.TextArea rows={3} maxLength={300} placeholder="Agregue una nota para el administrador" />
          </Form.Item>
        </Form>
        {resultMsg && <Alert type="success" message={resultMsg} showIcon />}
        {errorMsg && <Alert type="error" message={errorMsg} showIcon />}
      </div>
    </Modal>
  );
};

export default RequestInvoiceEditAuthorization;

