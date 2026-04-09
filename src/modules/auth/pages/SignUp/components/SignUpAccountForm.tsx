import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faLock,
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
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

import { login } from '@/features/auth/userSlice';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_PATH from '@/router/routes/routesName';

import { LogoContainer } from '@/modules/auth/pages/Login/components/Header/LogoContainer';
import { SocialLogin } from '@/modules/auth/pages/Login/components/SocialLogin';

import { runSignUpSubmission } from './utils/signUpSubmission';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { FormProps } from 'antd';

interface SignUpAccountValues {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpAccountFormProps {
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
`;

const IconInputWrapper = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1.25rem;
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
  color: rgb(255 255 255 / 70%);
  cursor: pointer;
  background: transparent;
  border: none;

  &:hover {
    color: #fff;
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
  margin-top: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #0f1323;
  cursor: pointer;
  background: ${ACCENT_COLOR};
  border: none;
  border-radius: 999px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
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
`;

type StyledSignUpFormProps = Omit<FormProps<SignUpAccountValues>, 'children'> & {
  children?: ReactNode;
};

const BaseSignUpForm = (props: StyledSignUpFormProps) => (
  <Form<SignUpAccountValues> {...props} />
);

type OnFinishFailedInfo = Parameters<
  NonNullable<FormProps<SignUpAccountValues>['onFinishFailed']>
>[0];

const StyledForm = styled(BaseSignUpForm)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: white;

  label {
    font-weight: 500;
    color: white !important;
  }

  .ant-form-item {
    margin-bottom: 0;
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

const LoginLink = styled(Link)`
  display: inline-flex;
  justify-content: center;
  width: 100%;
  margin-top: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #c8fff2;
  text-decoration: none;

  &:hover {
    color: #fff;
    text-decoration: underline;
  }
`;

const HelperText = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: rgb(255 255 255 / 75%);
  text-align: center;
`;

export const SignUpAccountForm: FC<SignUpAccountFormProps> = ({ setLoading }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm<SignUpAccountValues>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleInputKeyDownCapture = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();
    },
    [],
  );

  const handleFinish = useCallback(
    (values: SignUpAccountValues) => {
      setFormError(null);
      setLoading?.(true);
      setIsSubmitting(true);
      const email = values.email.trim().toLowerCase();

      void runSignUpSubmission({
        email,
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
        onSuccess: (user) => {
          dispatch(login(user as any));
          navigate(resolveDefaultHomeRoute(user), { replace: true });

          notification.success({
            title: 'Cuenta creada',
            description: 'Completa la creación de tu negocio para continuar.',
          });
        },
        password: values.password,
      });
    },
    [dispatch, navigate, setLoading],
  );

  const handleFinishFailed = useCallback((errorInfo: OnFinishFailedInfo) => {
    const messages = errorInfo.errorFields
      .flatMap(({ errors }) => errors)
      .filter(Boolean);
    setFormError(messages[0] || 'Por favor revisa los campos.');
  }, []);

  return (
    <Container>
      <Wrapper>
        <StyledForm
          autoComplete="off"
          form={form}
          initialValues={{
            email: '',
            password: '',
            confirmPassword: '',
          }}
          layout="vertical"
          onFinish={(values: SignUpAccountValues) => {
            void handleFinish(values);
          }}
          onFinishFailed={handleFinishFailed}
        >
          <LogoContainer hideWelcomeCopy />
          <HelperText>
            Crea tu cuenta y luego te guiaremos para registrar tu negocio.
          </HelperText>

          <Body>
            <Form.Item<SignUpAccountValues>
              name="email"
              label="Email"
              normalize={(value: string) =>
                typeof value === 'string' ? value.trim().toLowerCase() : value
              }
              rules={[
                { required: true, message: 'Ingresa tu email.' },
                { type: 'email', message: 'Ingresa un email válido.' },
              ]}
            >
              <IconInput
                icon={faEnvelope}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                ref={emailInputRef}
                onKeyDownCapture={handleInputKeyDownCapture}
              />
            </Form.Item>

            <Form.Item<SignUpAccountValues>
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: 'Ingresa la contraseña.' },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                  message:
                    'Mínimo 8 caracteres con mayúscula, minúscula y número.',
                },
              ]}
            >
              <IconInput
                icon={faLock}
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="new-password"
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
                      isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    <FontAwesomeIcon icon={isPasswordVisible ? faEyeSlash : faEye} />
                  </TogglePasswordButton>
                }
              />
            </Form.Item>

            <Form.Item<SignUpAccountValues>
              name="confirmPassword"
              label="Confirmar contraseña"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Confirma la contraseña.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('Las contraseñas no coinciden.'),
                    );
                  },
                }),
              ]}
            >
              <IconInput
                icon={faLock}
                type={isConfirmVisible ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirmar contraseña"
                onKeyDownCapture={handleInputKeyDownCapture}
                endSlot={
                  <TogglePasswordButton
                    type="button"
                    onClick={() => {
                      setIsConfirmVisible((prev) => !prev);
                    }}
                    aria-label={
                      isConfirmVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    <FontAwesomeIcon icon={isConfirmVisible ? faEyeSlash : faEye} />
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

          <SubmitButton type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoadingSpinner />
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </SubmitButton>
          <SocialLogin setLoading={setLoading} forceVisible />

          <LoginLink to={ROUTES_PATH.AUTH_TERM.LOGIN}>
            ¿Ya tienes cuenta? Inicia sesión
          </LoginLink>
        </StyledForm>
      </Wrapper>
    </Container>
  );
};

export default SignUpAccountForm;
