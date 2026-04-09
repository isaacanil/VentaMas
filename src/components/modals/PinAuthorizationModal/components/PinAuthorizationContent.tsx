import {
  KeyOutlined,
  LockOutlined,
  UserOutlined,
} from '@/constants/icons/antd';
import {
  Alert,
  Button,
  Divider,
  Form,
  Input,
  Spin,
  Typography,
  type FormInstance,
  type InputRef,
} from 'antd';
import type { RefObject } from 'react';
import styled from 'styled-components';

import { CustomPinInput } from './CustomPinInput';
import type { PasswordFormValues } from '../types';

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

interface PinAuthorizationContentProps {
  allowPasswordFallback: boolean;
  description: string;
  error: string;
  form: FormInstance<PasswordFormValues>;
  handleSubmit: () => void | Promise<void>;
  loading: boolean;
  passwordInputRef: RefObject<InputRef | null>;
  pinValue: string;
  reasonList: string[];
  setPinValue: (value: string) => void;
  toggleMode: () => void;
  usePassword: boolean;
  usernameInputRef: RefObject<InputRef | null>;
}

export const PinAuthorizationContent = ({
  allowPasswordFallback,
  description,
  error,
  form,
  handleSubmit,
  loading,
  passwordInputRef,
  pinValue,
  reasonList,
  setPinValue,
  toggleMode,
  usePassword,
  usernameInputRef,
}: PinAuthorizationContentProps) => {
  return (
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
        {reasonList.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {reasonList
              .map((reason, index) => ({
                key: `${reason}-${index + 1}`,
                value: reason,
              }))
              .map((reasonItem) => (
                <li key={reasonItem.key} style={{ fontSize: 13 }}>
                  {reasonItem.value}
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
            rules={[
              { required: true, message: 'Ingrese el nombre de usuario' },
            ]}
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
                void handleSubmit();
              }}
            />
          </Form.Item>
        ) : null}

        {!usePassword && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              PIN de Autorizacion (6 digitos)
            </Text>
            <CustomPinInput
              value={pinValue}
              onChange={setPinValue}
              onEnter={() => {
                if (loading) return;
                void handleSubmit();
              }}
              disabled={loading}
              maxLength={6}
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
                ? '← Usar PIN de 6 digitos'
                : '¿No tienes PIN? Usa tu contraseña →'}
            </Button>
          </ModeToggle>
        )}
      </Form>
    </div>
  );
};
