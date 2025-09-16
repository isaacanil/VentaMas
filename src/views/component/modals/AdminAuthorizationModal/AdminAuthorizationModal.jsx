import { useState } from 'react';
import { Modal, Spin, Button, Input, Form, Typography } from 'antd';
import styled from 'styled-components';
import { fbValidateUser } from '../../../../firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseconfig';

const { Paragraph } = Typography;

const ErrorMessage = styled.div`
  font-size: 0.95em;
  min-height: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FFEBEE;
  color: #D32F2F;
  border-radius: 4px;
  border: 1px solid #EF5350;
  padding: 8px 12px;
  margin-top: 0.8em;
  font-weight: 500;
`;

/**
 * Generic admin authorization modal.
 * Validates a second user's credentials and ensures role is allowed.
 *
 * Props:
 * - isOpen: boolean
 * - setIsOpen: (bool) => void
 * - onAuthorized: (approver) => void
 * - description: string
 * - allowedRoles: string[] (e.g., ['admin','owner','dev'])
 * - reasonList: string[] optional reasons to display
 */
export const AdminAuthorizationModal = ({
  isOpen,
  setIsOpen,
  onAuthorized,
  description = 'Se requiere autorización para continuar.',
  allowedRoles = ['admin', 'owner', 'dev'],
  reasonList = []
}) => {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetAndClose = () => {
    form.resetFields();
    setError('');
    setLoading(false);
    setIsOpen(false);
  };

  const fetchUserById = async (uid) => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error('No se encontró el usuario.');
    const data = snap.data()?.user || {};
    return { uid, ...data };
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError('');

      const { userData, response } = await fbValidateUser(values);
      if (response?.error) {
        setError(response.error);
        setLoading(false);
        return;
      }

      try {
        const approver = await fetchUserById(userData.uid);
        const role = approver?.role;
        if (!allowedRoles.includes(role)) {
          setError('Usuario no autorizado para aprobar esta acción.');
          setLoading(false);
          return;
        }
        onAuthorized(approver);
        resetAndClose();
      } catch (e) {
        setError(e.message || 'Error obteniendo datos del usuario.');
        setLoading(false);
      }
    } catch (validationError) {
      // keep modal open for user to correct inputs
    }
  };

  const handleCancel = () => {
    resetAndClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleCancel}
      centered
      width={460}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Autorizar
        </Button>,
      ]}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <Paragraph style={{ marginBottom: 8 }}>{description}</Paragraph>
          {reasonList?.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {reasonList.map((r, idx) => (
                <li key={idx} style={{ fontSize: 13 }}>{r}</li>
              ))}
            </ul>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Form form={form} layout="vertical" autoComplete="off">
              <Form.Item
                name="name"
                label="Usuario autorizado"
                rules={[{ required: true, message: 'Ingrese el usuario' }]}
              >
                <Input placeholder="Usuario" disabled={loading} autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Contraseña"
                rules={[{ required: true, message: 'Ingrese la contraseña' }]}
              >
                <Input.Password placeholder="Contraseña" disabled={loading} autoComplete="new-password" />
              </Form.Item>
            </Form>
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </>
        )}
      </div>
    </Modal>
  );
};

export default AdminAuthorizationModal;

