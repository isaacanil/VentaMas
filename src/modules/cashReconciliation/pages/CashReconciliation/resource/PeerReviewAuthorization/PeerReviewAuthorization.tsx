import { Modal, Spin, Button, Input, Form } from 'antd';
import { useState } from 'react';

import { fbValidateUser } from '@/firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser';

import { Header } from './components/Header/Header';
import {
  ErrorMessage,
  LoadingContainer,
  PEER_REVIEW_MODAL_STYLES,
} from './PeerReviewAuthorization.styles';

interface PeerReviewFormValues {
  name: string;
  password: string;
}

interface PeerReviewUserData {
  uid: string | null;
  [key: string]: unknown;
}

interface PeerReviewAuthorizationProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (user: PeerReviewUserData) => void | Promise<void>;
  description?: string;
}

export const PeerReviewAuthorization = ({
  isOpen,
  setIsOpen,
  onSubmit,
  description,
}: PeerReviewAuthorizationProps) => {
  const [form] = Form.useForm<PeerReviewFormValues>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    form.resetFields();
  };

  const handleSubmit = () => {
    if (loading) return;

    void form
      .validateFields()
      .then((values) => {
        setLoading(true);
        setError('');

        return fbValidateUser(values).then(
          ({ userData, response }) => {
            if (response?.error) {
              setError(response.error);
              setLoading(false);
              return;
            }

            return Promise.resolve(onSubmit(userData)).then(
              () => {
                resetForm();
                setIsOpen(false);
                setLoading(false);
              },
              (err) => {
                const msg =
                  err instanceof Error
                    ? err.message
                    : 'An error occurred. Please try again.';
                setError(msg);
                setLoading(false);
                console.error('Peer review authorization error:', err);
              },
            );
          },
          (err) => {
            const msg =
              err instanceof Error
                ? err.message
                : 'An error occurred. Please try again.';
            setError(msg);
            setLoading(false);
            console.error('Peer review authorization error:', err);
          },
        );
      })
      .catch(() => {
        // Form validation failed
      });
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
      styles={PEER_REVIEW_MODAL_STYLES}
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
      <Form form={form} layout="vertical" autoComplete="off">
        {loading ? (
          <LoadingContainer>
            <Spin size="large" />
          </LoadingContainer>
        ) : (
          <>
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
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </>
        )}
      </Form>
    </Modal>
  );
};
