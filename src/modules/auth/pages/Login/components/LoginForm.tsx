import {
  faEye,
  faEyeSlash,
  faLock,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, notification } from 'antd';
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';


import {
  fbSignIn,
  updateAppState,
  type FbSignInResult,
  type FbSignInUser,
} from '@/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn';
import ROUTES_PATH from '@/router/routes/routesName';

import { LogoContainer } from './Header/LogoContainer';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { FormProps } from 'antd';


interface LoginFormValues {
  username: string;
  password: string;
}

interface LoginFormProps {
  setLoading?: (value: boolean) => void;
}

const ACCENT_COLOR = '#54c0a8';

const isSignInUser = (value: unknown): value is FbSignInUser => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && record.id.length > 0;
};

const isValidSignInResult = (value: unknown): value is FbSignInResult => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return isSignInUser(record.user);
};

function assertIsValidSignInResult(
  value: unknown,
): asserts value is FbSignInResult {
  if (!isValidSignInResult(value)) {
    throw new Error('Respuesta inválida del servicio de autenticación.');
  }
}

const Container = styled.div`
  display: grid;
  align-items: start;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1em;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  @media (height >= 980px) {
    align-content: center;
    align-items: center;
    padding: 3rem 1.5rem;
    padding-top: 4rem;
  }
`;

const Wrapper = styled.div`
  flex-shrink: 0;
  width: 100%;
  max-width: 450px;
  padding: 0 1em 2rem;
  border-radius: 1em;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
`;

const StyledIcon = styled(FontAwesomeIcon)`
  font-size: 1rem;
  color: rgb(255 255 255 / 70%);
  transition:
    color 0.2s ease,
    transform 0.2s ease;
`;

const InputElement = styled.input`
  flex: 1;
  font-size: 1rem;
  line-height: 1.2;
  color: #fff;
  background: transparent;
  border: none;

  &::placeholder {
    color: rgb(255 255 255 / 60%);
  }

  &:focus {
    outline: none;
  }

  &:-webkit-autofill {
    box-shadow: 0 0 0 1000px rgb(15 19 35 / 55%) inset;
    -webkit-text-fill-color: #fff;
  }
`;

const IconInputWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1.25rem;
  background: rgb(15 19 35 / 55%);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 999px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;

  &:focus-within {
    background: rgb(15 19 35 / 72%);
    border-color: ${ACCENT_COLOR};
    box-shadow: 0 0 0 2px rgb(84 192 168 / 20%);
  }

  &:focus-within ${StyledIcon} {
    color: ${ACCENT_COLOR};
    transform: translateY(-1px);
  }

  &:focus-within ${InputElement}::placeholder {
    color: rgb(255 255 255 / 85%);
  }
`;

type IconInputProps = {
  icon: IconDefinition;
  endSlot?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon, endSlot, ...inputProps }, ref) => (
    <IconInputWrapper>
      <StyledIcon icon={icon} />
      <InputElement ref={ref} {...inputProps} />
      {endSlot}
    </IconInputWrapper>
  ),
);

IconInput.displayName = 'IconInput';

const TogglePasswordButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  color: rgb(255 255 255 / 70%);
  cursor: pointer;
  background: transparent;
  border: none;
  transition:
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    color: #fff;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${ACCENT_COLOR};
    outline-offset: 2px;
    border-radius: 999px;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SubmitButton = styled.button`
  display: inline-flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  margin-top: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #0f1323;
  letter-spacing: 0.02em;
  cursor: pointer;
  background: ${ACCENT_COLOR};
  border: none;
  border-radius: 999px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;

  &:hover {
    box-shadow: 0 12px 24px rgb(84 192 168 / 28%);
    filter: brightness(1.05);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: 0 8px 18px rgb(84 192 168 / 18%);
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.6;
    filter: none;
    transform: none;
  }
`;

const LoadingSpinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid rgb(15 19 35 / 40%);
  border-top-color: #0f1323;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

type StyledLoginFormProps = Omit<FormProps<LoginFormValues>, 'children'> & {
  children?: ReactNode;
};

const BaseLoginForm = (props: StyledLoginFormProps) => (
  <Form<LoginFormValues> {...props} />
);

type OnFinishFailedInfo = Parameters<
  NonNullable<FormProps<LoginFormValues>['onFinishFailed']>
>[0];

const StyledForm = styled(BaseLoginForm)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: space-between;
  height: 100%;
  color: white;

  label {
    font-weight: 500;
    color: white !important;
  }

  .ant-form-item {
    margin-bottom: 0;
  }

  .ant-form-item + .ant-form-item {
    margin-top: 0;
  }

  .ant-select .ant-select-selector {
    border-radius: 8px !important;
  }

  .ant-form-item-explain-error {
    display: none;
  }
`;

const FormErrorMessage = styled.div`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffb4b4;
  text-align: center;
  background: rgb(255 87 87 / 18%);
  border-radius: 8px;
`;

export const LoginForm: FC<LoginFormProps> = ({ setLoading }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm<LoginFormValues>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const handleUsernameKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        passwordInputRef.current?.focus();
      }
    },
    [],
  );

  const handleFinish = useCallback(
    async ({ username, password }: LoginFormValues) => {
      setFormError(null);
      setLoading?.(true);
      setIsSubmitting(true);

      try {
        const normalizedUsername = username.trim().toLowerCase();
        form.setFieldsValue({ username: normalizedUsername });

        const rawResult: unknown = await fbSignIn({
          name: normalizedUsername,
          password,
        });

        assertIsValidSignInResult(rawResult);
        const signInResult: FbSignInResult = rawResult;
        const userData: FbSignInUser = signInResult.user;

        updateAppState(dispatch, userData);
        navigate(ROUTES_PATH.BASIC_TERM.HOME);

        notification.success({
          title: 'Inicio de sesión exitoso',
          description: '¡Bienvenido!',
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : 'No se pudo iniciar sesión. Inténtalo de nuevo.';

        setFormError(errorMessage);

        notification.error({
          title: 'Error',
          description: errorMessage,
        });
      } finally {
        setLoading?.(false);
        setIsSubmitting(false);
      }
    },
    [dispatch, form, navigate, setFormError, setLoading],
  );

  const handleFinishFailed = useCallback(
    (errorInfo: OnFinishFailedInfo) => {
      const messages = errorInfo.errorFields
        .flatMap(({ errors }) => errors)
        .filter(Boolean);

      if (messages.length > 0) {
        setFormError(messages.join(' '));
        return;
      }

      setFormError('Por favor revisa los campos marcados en rojo.');
    },
    [setFormError],
  );

  return (
    <Container>
      <Wrapper>
        <StyledForm
          autoComplete="off"
          form={form}
          initialValues={{ username: '', password: '' }}
          layout="vertical"
          onFinish={(values: LoginFormValues) => {
            void handleFinish(values);
          }}
          onFinishFailed={handleFinishFailed}
        >
          <LogoContainer />
          <Body>
            <Form.Item<LoginFormValues>
              name="username"
              label="Usuario"
              normalize={(value: string) =>
                typeof value === 'string' ? value.toLowerCase() : value
              }
              rules={[
                { required: true, message: 'Ingresa el nombre de usuario.' },
              ]}
            >
              <IconInput
                icon={faUser}
                placeholder="Usuario"
                autoComplete="username"
                autoCapitalize="none"
                ref={usernameInputRef}
                onKeyDown={handleUsernameKeyDown}
              />
            </Form.Item>

            <Form.Item<LoginFormValues>
              name="password"
              label="Contraseña"
              rules={[{ required: true, message: 'Ingresa la contraseña.' }]}
            >
              <IconInput
                icon={faLock}
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Contraseña"
                ref={passwordInputRef}
                endSlot={
                  <TogglePasswordButton
                    type="button"
                    onClick={() => {
                      setIsPasswordVisible((prev) => !prev);
                      passwordInputRef.current?.focus();
                    }}
                    aria-label={
                      isPasswordVisible
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                    title={
                      isPasswordVisible
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    <FontAwesomeIcon
                      icon={isPasswordVisible ? faEyeSlash : faEye}
                    />
                  </TogglePasswordButton>
                }
              />
            </Form.Item>
          </Body>

          {formError ? (
            <FormErrorMessage role="alert" aria-live="assertive">
              {formError}
            </FormErrorMessage>
          ) : null}

          <SubmitButton
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner />
                Iniciando...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </SubmitButton>
        </StyledForm>
      </Wrapper>
    </Container>
  );
};
