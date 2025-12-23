import { KeyOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  Modal,
  Button,
  Form,
  Input,
  Typography,
  Alert,
  Spin,
  Divider,
} from 'antd';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { fbValidateUser } from '@/firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser';
import { fbValidateUserPin } from '@/firebase/authorization/pinAuth';
import { db } from '@/firebase/firebaseconfig';

const { Paragraph, Text } = Typography;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2em;
  padding: 8px 12px;
  margin-top: 0.8em;
  font-size: 0.95em;
  font-weight: 500;
  color: #d32f2f;
  background-color: #ffebee;
  border: 1px solid #ef5350;
  border-radius: 4px;
`;

const ModeToggle = styled.div`
  margin-top: 16px;
  text-align: center;

  button {
    height: auto;
    padding: 0;
    font-size: 0.9em;
  }
`;

const PinInputContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 24px 0;
`;

const PinDot = styled.div`
  width: 48px;
  height: 56px;
  border: 2px solid ${(props) => (props.$filled ? '#52c41a' : '#d9d9d9')};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => (props.$filled ? '#f6ffed' : '#fafafa')};
  transition: all 0.2s ease;
  position: relative;

  ${(props) =>
    props.$active &&
    `
    border-color: #52c41a;
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
  `}

  &::after {
    width: 12px;
    height: 12px;
    content: '';
    background-color: ${(props) => (props.$filled ? '#52c41a' : 'transparent')};
    border-radius: 50%;
    transition: all 0.15s ease;
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  pointer-events: none;
  opacity: 0;
`;

const PinInputWrapper = styled.div`
  cursor: text;
`;

/**
 * Componente de input de PIN personalizado con puntos visuales
 */
const CustomPinInput = ({
  value = '',
  onChange,
  onEnter,
  disabled,
  maxLength = 6,
  autoFocus = false,
}) => {
  const inputRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(value.length);

  useEffect(() => {
    setActiveIndex(value.length);
  }, [value]);

  // Auto focus cuando el componente se monta
  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      // Pequeño delay para asegurar que el modal esté completamente renderizado
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    onChange?.(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && value.length > 0) {
      onChange?.(value.slice(0, -1));
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      onEnter?.();
      e.preventDefault();
    }
  };

  const dots = Array.from({ length: maxLength }, (_, index) => (
    <PinDot
      key={index}
      $filled={index < value.length}
      $active={index === activeIndex && !disabled}
    />
  ));

  return (
    <PinInputWrapper onClick={handleContainerClick}>
      <PinInputContainer>{dots}</PinInputContainer>
      <HiddenInput
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete="off"
      />
    </PinInputWrapper>
  );
};

/**
 * Modal de autorización con PIN o contraseña
 *
 * Props:
 * - isOpen: boolean
 * - setIsOpen: (bool) => void
 * - onAuthorized: (approver) => void
 * - description: string
 * - allowedRoles: string[] (e.g., ['admin','owner','dev'])
 * - reasonList: string[] optional reasons to display
 * - module: string (e.g., 'invoices', 'accountsReceivable')
 * - allowPasswordFallback: boolean (default true) - permitir usar contraseña si falla PIN
 */
export const PinAuthorizationModal = ({
  isOpen,
  setIsOpen,
  onAuthorized,
  description = 'Se requiere autorización para continuar.',
  allowedRoles = ['admin', 'owner', 'dev'],
  reasonList = [],
  module = 'invoices',
  allowPasswordFallback = true,
}) => {
  const currentUser = useSelector(selectUser);
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [pinValue, setPinValue] = useState('');

  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const resetAndClose = () => {
    form.resetFields();
    setError('');
    setLoading(false);
    setUsePassword(false);
    setPinValue('');
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen || loading) return;

    const timer = setTimeout(() => {
      if (usePassword) {
        usernameInputRef.current?.focus?.();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, usePassword, loading]);

  const fetchUserById = async (uid) => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error('No se encontró el usuario.');
    const data = snap.data()?.user || {};
    return { uid, ...data };
  };

  const handleSubmitPin = async (pin) => {
    setLoading(true);
    setError('');

    try {
      if (!pin || pin.length !== 6) {
        setError('El PIN debe tener 6 dígitos');
        return;
      }

      const result = await fbValidateUserPin(currentUser, {
        pin,
        module,
      });

      if (!result.valid) {
        setError(result.reason || 'PIN inválido');
        return;
      }

      const role = result.user?.role;
      if (!allowedRoles.includes(role)) {
        setError('Usuario no autorizado para aprobar esta acción.');
        return;
      }

      onAuthorized(result.user);
      resetAndClose();
    } catch (e) {
      setError(e?.message || 'Error validando PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async ({ username, password }) => {
    setLoading(true);
    setError('');

    try {
      const { userData, response } = await fbValidateUser({
        name: username,
        password,
      });

      if (response?.error) {
        setError(response.error);
        return;
      }

      const approver = await fetchUserById(userData.uid);
      const role = approver?.role;
      if (!allowedRoles.includes(role)) {
        setError('Usuario no autorizado para aprobar esta acción.');
        return;
      }

      onAuthorized(approver);
      resetAndClose();
    } catch (e) {
      setError(e?.message || 'Error obteniendo datos del usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    try {
      if (usePassword) {
        const values = await form.validateFields(['username', 'password']);
        await handleSubmitPassword(values);
      } else {
        await handleSubmitPin(pinValue);
      }
    } catch {
      // Form validation errors, keep modal open
    }
  };

  const handleCancel = () => {
    resetAndClose();
  };

  const toggleMode = () => {
    if (loading) return;
    setUsePassword(!usePassword);
    setError('');
    setPinValue('');
    form.resetFields(['password', 'username']);

    // Asegurar foco rápido al cambiar modo
    setTimeout(() => {
      if (!usePassword) {
        usernameInputRef.current?.focus?.();
      }
    }, 0);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleCancel}
      centered
      width={480}
      zIndex={99990}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          disabled={loading}
          onClick={handleSubmit}
        >
          Autorizar
        </Button>,
      ]}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          {usePassword ? (
            <LockOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          ) : (
            <KeyOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          )}
        </div>

        <div>
          <Paragraph style={{ marginBottom: 8, textAlign: 'center' }}>
            {description}
          </Paragraph>
          {reasonList?.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {reasonList.map((r, idx) => (
                <li key={idx} style={{ fontSize: 13 }}>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Alert
          message={
            usePassword ? 'Modo: Contraseña Completa' : 'Modo: PIN Rápido'
          }
          type={usePassword ? 'info' : 'success'}
          showIcon
          style={{ marginTop: 8 }}
        />

        <Form form={form} layout="vertical" autoComplete="off">
          {usePassword && (
            <Form.Item
              name="username"
              label="Nombre de Usuario"
              rules={[{ required: true, message: 'Ingrese el nombre de usuario' }]}
            >
              <Input
                ref={usernameInputRef}
                prefix={<UserOutlined />}
                placeholder="Usuario"
                disabled={loading}
                autoComplete="off"
                size="large"
                onPressEnter={() => {
                  if (loading) return;
                  passwordInputRef.current?.focus?.();
                }}
              />
            </Form.Item>
          )}

          {usePassword ? (
            <Form.Item
              name="password"
              label="Contraseña"
              rules={[{ required: true, message: 'Ingrese la contraseña' }]}
            >
              <Input.Password
                ref={passwordInputRef}
                prefix={<LockOutlined />}
                placeholder="Contraseña"
                disabled={loading}
                autoComplete="new-password"
                size="large"
                onPressEnter={() => {
                  if (loading) return;
                  handleSubmit();
                }}
              />
            </Form.Item>
          ) : null}

          {!usePassword && (
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                PIN de Autorización (6 dígitos)
              </Text>
              <CustomPinInput
                value={pinValue}
                onChange={setPinValue}
                onEnter={() => {
                  if (loading) return;
                  handleSubmit();
                }}
                disabled={loading}
                maxLength={6}
                autoFocus={true}
              />
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Spin size="small" style={{ marginTop: 8 }} />
                </div>
              )}
            </div>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {allowPasswordFallback && (
            <ModeToggle>
              <Divider plain style={{ margin: '12px 0' }}>
                <Text type="secondary" style={{ fontSize: '0.85em' }}>
                  o
                </Text>
              </Divider>
              <Button type="link" onClick={toggleMode} disabled={loading}>
                {usePassword
                  ? '← Usar PIN de 6 dígitos'
                  : '¿No tienes PIN? Usa tu contraseña →'}
              </Button>
            </ModeToggle>
          )}
        </Form>
      </div>
    </Modal>
  );
};

export default PinAuthorizationModal;
