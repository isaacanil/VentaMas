import { Modal, Button, Form, Typography, Alert } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { requestInvoiceEditAuthorization } from '@/firebase/authorizations/invoiceEditAuthorizations';
import type { InvoiceData } from '@/types/invoice';

const { Paragraph } = Typography;

interface ReasonsListProps {
  reasons: string[];
}

const ReasonsList = ({ reasons }: ReasonsListProps) =>
  reasons?.length ? (
    <ul
      style={{
        marginTop: 0,
        marginBottom: 0,
        paddingLeft: 20,
        lineHeight: 1.8,
      }}
    >
      {reasons.map((r, idx) => (
        <li key={idx} style={{ fontSize: 14, marginBottom: 8 }}>
          {r}
        </li>
      ))}
    </ul>
  ) : null;

interface RequestFormValues {
  note?: string;
}

interface RequestInvoiceEditAuthorizationProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  invoice: InvoiceData | null | undefined;
  reasons?: string[];
  onRequested?: (result: unknown) => void;
}

export const RequestInvoiceEditAuthorization = ({
  isOpen,
  setIsOpen,
  invoice,
  reasons = [],
  onRequested,
}: RequestInvoiceEditAuthorizationProps) => {
  const [form] = Form.useForm<RequestFormValues>();
  type RequestAuthRootState = Parameters<typeof selectUser>[0];
  const user = useSelector((state: RequestAuthRootState) => selectUser(state));
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
      const res = await requestInvoiceEditAuthorization(
        user,
        invoice,
        reasons,
        values.note || '',
      );
      if (res?.alreadyPending) {
        setResultMsg('Ya existe una solicitud pendiente.');
      } else {
        setResultMsg('Solicitud enviada. Un administrador la revisará.');
      }
      setSubmitting(false);
      if (onRequested) onRequested(res);

      // Cerrar automáticamente después de 5 segundos
      setTimeout(() => {
        handleCancel();
      }, 5000);
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return; // validation
      setSubmitting(false);
      const message =
        e instanceof Error ? e.message : 'Error enviando solicitud';
      setErrorMsg(message);
      console.log(e);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleCancel}
      centered
      width={560}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={submitting}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleRequest}
          loading={submitting}
        >
          Solicitar
        </Button>,
      ]}
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <Paragraph
          style={{
            marginBottom: 0,
            fontSize: 16,
            fontWeight: 600,
            lineHeight: 1.6,
          }}
        >
          Se requiere autorización para editar esta factura.
        </Paragraph>
        <ReasonsList reasons={reasons} />
        {resultMsg && <Alert type="success" message={resultMsg} showIcon />}
        {errorMsg && <Alert type="error" message={errorMsg} showIcon />}
      </div>
    </Modal>
  );
};

export default RequestInvoiceEditAuthorization;
