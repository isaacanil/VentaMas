import { KeyOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Modal, Button, Form, Input, Typography, Alert, Spin, Divider } from 'antd';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../features/auth/userSlice';
import { fbValidateUser } from '../../../../firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser';
import { fbValidateUserPin } from '../../../../firebase/authorization/pinAuth';
import { db } from '../../../../firebase/firebaseconfig';

const { Paragraph, Text } = Typography;

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

const ModeToggle = styled.div`
  text-align: center;
  margin-top: 16px;

  button {
    padding: 0;
    height: auto;
    font-size: 0.9em;
  }
`;

const PinInputContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 24px 0;
`;

const PinDot = styled.div`
  width: 48px;
  height: 56px;
  border: 2px solid ${props => props.$filled ? '#52c41a' : '#d9d9d9'};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.$filled ? '#f6ffed' : '#fafafa'};
  transition: all 0.2s ease;
  position: relative;
  
  ${props => props.$active && `
    border-color: #52c41a;
    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
  `}

  &::after {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${props => props.$filled ? '#52c41a' : 'transparent'};
    transition: all 0.15s ease;
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
`;

const PinInputWrapper = styled.div`
  cursor: text;
`;

/**
 * Componente de input de PIN personalizado con puntos visuales
 */
const CustomPinInput = ({ value = '', onChange, disabled, maxLength = 6, autoFocus = false }) => {
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
      <PinInputContainer>
        {dots}
      </PinInputContainer>
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

  const resetAndClose = () => {
    form.resetFields();
    setError('');
    setLoading(false);
    setUsePassword(false);
    setPinValue('');
    setIsOpen(false);
  };

  const fetchUserById = async (uid) => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error('No se encontró el usuario.');
    const data = snap.data()?.user || {};
    return { uid, ...data };
  };

  const handleSubmitPin = async (pin) => {
    try {
      setLoading(true);
      setError('');

      // Validar que el PIN tenga 6 dígitos
      if (!pin || pin.length !== 6) {
        setError('El PIN debe tener 6 dígitos');
        setLoading(false);
        return;
      }

      // Validar PIN
      const result = await fbValidateUserPin(
        currentUser,
        {
          pin,
          module,
        }
      );

      if (!result.valid) {
        setError(result.reason || 'PIN inválido');
        setLoading(false);
        return;
      }

      // Verificar rol
      const role = result.user?.role;
      if (!allowedRoles.includes(role)) {
        setError('Usuario no autorizado para aprobar esta acción.');
        setLoading(false);
        return;
      }

      // Autorización exitosa
      onAuthorized(result.user);
      resetAndClose();
    } catch (e) {
      setError(e.message || 'Error validando PIN');
      setLoading(false);
    }
  };

  const handleSubmitPassword = async ({ username, password }) => {
    try {
      setLoading(true);
      setError('');

      const { userData, response } = await fbValidateUser({ name: username, password });
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
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (usePassword) {
        const values = await form.validateFields(['username', 'password']);
        await handleSubmitPassword(values);
      } else {
        await handleSubmitPin(pinValue);
      }
    } catch (validationError) {
      // Form validation errors, keep modal open
    }
  };

  const handleCancel = () => {
    resetAndClose();
  };

  const toggleMode = () => {
    setUsePassword(!usePassword);
    setError('');
    setPinValue('');
    form.resetFields(['password', 'username']);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleCancel}
      centered
      width={480}
      zIndex={99990}
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
                <li key={idx} style={{ fontSize: 13 }}>{r}</li>
              ))}
            </ul>
          )}
        </div>

        <Alert
          message={usePassword ? 'Modo: Contraseña Completa' : 'Modo: PIN Rápido'}
          type={usePassword ? 'info' : 'success'}
          showIcon
          style={{ marginTop: 8 }}
        />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 140 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Form form={form} layout="vertical" autoComplete="off">
              {usePassword && (
                <Form.Item
                  name="username"
                  label="Nombre de Usuario"
                  rules={[{ required: true, message: 'Ingrese el nombre de usuario' }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Usuario"
                    disabled={loading}
                    autoComplete="off"
                    size="large"
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
                    prefix={<LockOutlined />}
                    placeholder="Contraseña"
                    disabled={loading}
                    autoComplete="new-password"
                    size="large"
                  />
                </Form.Item>
              ) : null}
            </Form>

            {!usePassword && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  PIN de Autorización (6 dígitos)
                </Text>
                <CustomPinInput
                  value={pinValue}
                  onChange={setPinValue}
                  disabled={loading}
                  maxLength={6}
                  autoFocus={true}
                />
              </div>
            )}

            {error && <ErrorMessage>{error}</ErrorMessage>}

            {allowPasswordFallback && (
              <ModeToggle>
                <Divider plain style={{ margin: '12px 0' }}>
                  <Text type="secondary" style={{ fontSize: '0.85em' }}>o</Text>
                </Divider>
                <Button type="link" onClick={toggleMode}>
                  {usePassword
                    ? '← Usar PIN de 6 dígitos'
                    : '¿No tienes PIN? Usa tu contraseña →'}
                </Button>
              </ModeToggle>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default PinAuthorizationModal;
