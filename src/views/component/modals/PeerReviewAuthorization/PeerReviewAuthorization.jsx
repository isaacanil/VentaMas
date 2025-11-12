import { Modal, Spin, Button, Input, Form } from 'antd';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { clearCashCount } from '../../../../features/cashCount/cashCountManagementSlice';
import { fbValidateUser } from '../../../../firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser';

import { Header } from './components/Header/Header';

const ErrorMessage = styled.div`
  font-size: 1em;
  min-height: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffebee;
  color: #d32f2f;
  border-radius: 4px;
  border: 1px solid #ef5350;
  margin: 0;
  padding: 8px 12px;
  margin-top: 1em;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const PeerReviewAuthorization = ({
  isOpen,
  setIsOpen,
  onSubmit,
  description,
}) => {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const resetForm = () => {
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      try {
        const { userData, response } = await fbValidateUser(values);
        if (response?.error) {
          setError(response.error);
          setLoading(false);
          return;
        }
        onSubmit(userData);
        setTimeout(() => {
          navigate(-1);
          dispatch(clearCashCount());
        }, 1000);
      } catch (err) {
        setLoading(false);
        setError('An error occurred. Please try again.');
        console.error('Peer review authorization error:', err);
      }

      resetForm();
      setIsOpen(false);
    } catch {
      // Form validation failed
      return;
    }
  };

  const handleCancel = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 300);

    resetForm();
    setError('');
    setLoading(false);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleCancel}
      centered
      width={450}
      destroyOnHidden
      styles={{
        body: {
          padding: '0px',
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2em',
        },
        content: {},
      }}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Autorizar
        </Button>,
      ]}
    >
      <Header description={description} />
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 100,
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Form form={form} layout="vertical" autoComplete="off">
            <Form.Item
              name="name"
              label="Nombre de usuario"
              rules={[
                { required: true, message: 'Por favor ingrese su usuario' },
              ]}
            >
              <Input
                placeholder="Usuario"
                disabled={loading}
                autoComplete="off"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: 'Por favor ingrese su contraseña' },
              ]}
            >
              <Input.Password
                placeholder="Contraseña"
                disabled={loading}
                autoComplete="new-password"
              />
            </Form.Item>
          </Form>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </>
      )}
    </Modal>
  );
};
