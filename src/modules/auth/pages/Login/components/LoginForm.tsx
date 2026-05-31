import {
  faEye,
  faEyeSlash,
  faLock,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { App as AntApp, Form } from 'antd';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type KeyboardEvent,
} from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { applyAuthenticatedUserState } from '@/modules/auth/repositories/authState.repository';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_PATH from '@/router/routes/routesName';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';

import {
  Body,
  Container,
  FormErrorMessage,
  IconInput,
  LoadingSpinner,
  RegisterLink,
  StyledForm,
  SubmitButton,
  TogglePasswordButton,
  Wrapper,
  type LoginFormValues,
  type OnFinishFailedInfo,
} from './LoginForm.styles';
import { LogoContainer } from './Header/LogoContainer';
import { SocialLogin } from './SocialLogin';
import { resolvePublicAuthVisibility } from './socialLogin.utils';
import { runLoginSubmission } from './utils/loginSubmission';

interface LoginFormProps {
  setLoading?: (value: boolean) => void;
}

export const LoginForm: FC<LoginFormProps> = ({ setLoading }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { notification } = AntApp.useApp();
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
            message: 'Error',
            description: errorMessage,
          });
        },
        onSettled: () => {
          setLoading?.(false);
          setIsSubmitting(false);
        },
        onSuccess: (userData) => {
          applyAuthenticatedUserState(dispatch, userData);
          navigate(resolveDefaultHomeRoute(userData), { replace: true });

          notification.success({
            message: 'Inicio de sesion exitoso',
            description: 'Bienvenido!',
          });
        },
        password,
        username: normalizedUsername,
      });
    },
    [dispatch, form, navigate, notification, setLoading],
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
              label="Contrasena"
              rules={[{ required: true, message: 'Ingresa la contrasena.' }]}
            >
              <IconInput
                icon={faLock}
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Contrasena"
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
                        ? 'Ocultar contrasena'
                        : 'Mostrar contrasena'
                    }
                    title={
                      isPasswordVisible
                        ? 'Ocultar contrasena'
                        : 'Mostrar contrasena'
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
              'Iniciar sesion'
            )}
          </SubmitButton>
          <SocialLogin setLoading={setLoading} />
          {shouldRenderPublicAuth && canRegisterUsers ? (
            <RegisterLink to={ROUTES_PATH.AUTH_TERM.SIGNUP}>
              No tienes cuenta? Registrate
            </RegisterLink>
          ) : null}
        </StyledForm>
      </Wrapper>
    </Container>
  );
};
