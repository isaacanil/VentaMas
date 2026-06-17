import {
  KeyOutlined,
  LockOutlined,
  UserOutlined,
} from '@/constants/icons/antd';
import {
  Button,
  Form,
  Input,
  Spin,
  type FormInstance,
  type InputRef,
} from 'antd';
import type { RefObject } from 'react';

import {
  AuthorizationIcon,
  ContentGrid,
  DescriptionParagraph,
  ErrorMessage,
  IconHeader,
  LoadingRow,
  ModeAlert,
  ModeDivider,
  ModeSeparatorText,
  ModeToggle,
  PinLabel,
  ReasonItem,
  ReasonList,
} from './PinAuthorizationContent.styles';
import { CustomPinInput } from './CustomPinInput';
import type { PasswordFormValues } from '../types';

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
  const authorizationMode = usePassword ? 'password' : 'pin';

  return (
    <ContentGrid>
      <IconHeader>
        <AuthorizationIcon $mode={authorizationMode}>
          {usePassword ? <LockOutlined /> : <KeyOutlined />}
        </AuthorizationIcon>
      </IconHeader>

      <div>
        <DescriptionParagraph>{description}</DescriptionParagraph>
        {reasonList.length > 0 && (
          <ReasonList>
            {reasonList
              .map((reason, index) => ({
                key: `${reason}-${index + 1}`,
                value: reason,
              }))
              .map((reasonItem) => (
                <ReasonItem key={reasonItem.key}>{reasonItem.value}</ReasonItem>
              ))}
          </ReasonList>
        )}
      </div>

      <ModeAlert
        message={usePassword ? 'Modo: Contrasena completa' : 'Modo: PIN rapido'}
        type={usePassword ? 'info' : 'success'}
        showIcon
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
            label="Contrasena"
            rules={[{ required: true, message: 'Ingrese la contrasena' }]}
          >
            <Input.Password
              ref={passwordInputRef}
              prefix={<LockOutlined />}
              placeholder="Contrasena"
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
            <PinLabel strong>PIN de autorizacion (6 digitos)</PinLabel>
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
              <LoadingRow>
                <Spin size="small" />
              </LoadingRow>
            )}
          </div>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {allowPasswordFallback && (
          <ModeToggle>
            <ModeDivider plain>
              <ModeSeparatorText type="secondary">o</ModeSeparatorText>
            </ModeDivider>
            <Button type="link" onClick={toggleMode} disabled={loading}>
              {usePassword
                ? 'Usar PIN de 6 digitos'
                : 'No tienes PIN? Usa tu contrasena'}
            </Button>
          </ModeToggle>
        )}
      </Form>
    </ContentGrid>
  );
};
