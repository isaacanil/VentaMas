import {
  faEnvelope,
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
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

import {
  updateAppState,
} from '@/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_PATH from '@/router/routes/routesName';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';

import { LogoContainer } from './Header/LogoContainer';
import { SocialLogin } from './SocialLogin';
import { runLoginSubmission } from './utils/loginSubmission';
import { resolvePublicAuthVisibility } from './socialLogin.utils';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { FormProps } from 'antd';

interface LoginFormValues {
  username: string;
  password: string;
}

interface LoginFormProps {
  setLoading?: (value: boolean) => void;
}

const ACCENT_COLOR = 'var(--color)';

const Container = styled.div`
  display: grid;
  align-items: start;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0;
  padding-bottom: 1.4em;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255 / 20%) transparent;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgb(255 255 255 / 20%);
    border-radius: 20px;
    border: transparent;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgb(255 255 255 / 30%);
  }

  @media (height >= 980px) {
    align-content: center;
    align-items: center;
    padding: 2rem 1.5rem;
  }

  @media (width <= 800px) {
    padding-top: 0.25rem;
    padding-right: 0.75rem;
    padding-bottom: 1rem;
    padding-left: 0.75rem;
  }
`;

const Wrapper = styled.div`
  flex-shrink: 0;
  width: 100%;
  max-width: 450px;
  padding: 0;
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
  min-width: 0;
  font-size: 1rem;
  line-height: 1.2;
  color: #fff;
  background: transparent;
  border: none;

  &::placeholder {
    color: rgb(255 255 255 / 50%);
  }

  &:focus {
    outline: none;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    /* Forzamos el color del texto a blanco */
    -webkit-text-fill-color: #fff !important;

    /* En lugar de fondo transparente (que el navegador ignora), 
       usamos una sombra interna del color de tu fondo oscuro */
    transition: background-color 5000s ease-in-out 0s;
    box-shadow: 0 0 0 1000px transparent inset !important;

    /* Si el fondo del contenedor es oscuro, usa el color exacto aquí 
       para evitar que el navegador pinte su azul/amarillo */
    box-shadow: 0 0 0 1000px #1f1f1f inset !important;
  }
`;

const IconInputWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 999px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    border-color: rgb(255 255 255 / 30%);
    background: rgb(255 255 255 / 2%);
  }

  &:focus-within {
    background: rgb(255 255 255 / 5%);
    border-color: ${ACCENT_COLOR};
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color) 20%, transparent);
  }

  &:focus-within ${StyledIcon} {
    color: ${ACCENT_COLOR};
    transform: translateY(-1px);
  }

  &:focus-within ${InputElement}::placeholder {
    color: rgb(255 255 255 / 80%);
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
    box-shadow: 0 12px 24px color-mix(in srgb, var(--color) 28%, transparent);
    filter: brightness(1.05);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: 0 8px 18px color-mix(in srgb, var(--color) 18%, transparent);
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
  display: inline-block;
  width: 1.1em;
  height: 1.1em;
  border: 2px solid rgb(15 19 35 / 20%);
  border-top-color: currentcolor;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
  vertical-align: middle;
  flex-shrink: 0;
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

const RegisterLink = styled(Link)`
  display: inline-flex;
  justify-content: center;
  width: 100%;
  margin-top: 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #c8fff2;
  text-decoration: none;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`;

export const LoginForm: FC<LoginFormProps> = ({ setLoading }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm<LoginFormValues>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const shouldRenderPublicAuth = resolvePublicAuthVisibility(location.search);
  const canRegisterUsers = isFrontendFeatureEnabled('userRegistration');

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

  const handleInputKeyDownCapture = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      // Avoid global keydown listeners while typing in login inputs.
      event.stopPropagation();
    },
    [],
  );

  const handleFinish = useCallback(
    ({ username, password }: LoginFormValues) => {
      setFormError(null);
      setLoading?.(true);
      setIsSubmitting(true);
      const normalizedUsername = username.trim().toLowerCase();
      form.setFieldsValue({ username: normalizedUsername });

      void runLoginSubmission({
        onError: (errorMessage) => {
          setFormError(errorMessage);
          notification.error({
            title: 'Error',
            description: errorMessage,
          });
        },
        onSettled: () => {
          setLoading?.(false);
          setIsSubmitting(false);
        },
        onSuccess: (userData) => {
          updateAppState(dispatch, userData);
          navigate(resolveDefaultHomeRoute(userData), { replace: true });

          notification.success({
            title: 'Inicio de sesión exitoso',
            description: '¡Bienvenido!',
          });
        },
        password,
        username: normalizedUsername,
      });
    },
    [dispatch, form, navigate, setLoading],
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
                onKeyDownCapture={handleInputKeyDownCapture}
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
                onKeyDownCapture={handleInputKeyDownCapture}
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
          <SocialLogin setLoading={setLoading} />
          {shouldRenderPublicAuth && canRegisterUsers ? (
            <RegisterLink to={ROUTES_PATH.AUTH_TERM.SIGNUP}>
              ¿No tienes cuenta? Regístrate
            </RegisterLink>
          ) : null}
        </StyledForm>
      </Wrapper>
    </Container>
  );
};
