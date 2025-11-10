import { faEye, faEyeSlash, faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Form, notification } from "antd";
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
} from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";

import { LogoContainer } from "./Header/LogoContainer";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { FormProps } from "antd";

import { fbSignIn, updateAppState, type FbSignInResult, type FbSignInUser } from "@/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn";
import ROUTES_PATH from "@/routes/routesName";


type LoginFormValues = {
  username: string;
  password: string;
};

type LoginFormProps = {
  setLoading?: (value: boolean) => void;
};

const ACCENT_COLOR = "#54c0a8";

const isSignInUser = (value: unknown): value is FbSignInUser => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && record.id.length > 0;
};

const isValidSignInResult = (value: unknown): value is FbSignInResult => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return isSignInUser(record.user);
};

function assertIsValidSignInResult(value: unknown): asserts value is FbSignInResult {
  if (!isValidSignInResult(value)) {
    throw new Error("Respuesta inválida del servicio de autenticación.");
  }
}

const Container = styled.div`
  padding: 1em 1em;
  width: 100%;
  height: 100%;
  display: grid;
  align-items: start;
  justify-content: center;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (min-height: 980px) {
    padding: 3rem 1.5rem;
    padding-top: 4rem;
    align-items: center;
    align-content: center;
  }

`;

const Wrapper = styled.div`
  max-width: 450px;
  width: 100%;
  border-radius: 1em;
  padding: 0 1em 2rem;
  flex-shrink: 0;
`;

const Body = styled.div`
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StyledIcon = styled(FontAwesomeIcon)`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  transition: color 0.2s ease, transform 0.2s ease;
`;

const InputElement = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  color: #ffffff;
  font-size: 1rem;
  line-height: 1.2;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
  }

  &:-webkit-autofill {
    -webkit-text-fill-color: #ffffff;
    box-shadow: 0 0 0 1000px rgba(15, 19, 35, 0.55) inset;
    -webkit-box-shadow: 0 0 0 1000px rgba(15, 19, 35, 0.55) inset;
  }
`;

const IconInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  width: 100%;
  border-radius: 999px;
  background: rgba(15, 19, 35, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

  &:focus-within {
    border-color: ${ACCENT_COLOR};
    box-shadow: 0 0 0 2px rgba(84, 192, 168, 0.2);
    background: rgba(15, 19, 35, 0.72);
  }

  &:focus-within ${StyledIcon} {
    color: ${ACCENT_COLOR};
    transform: translateY(-1px);
  }

  &:focus-within ${InputElement}::placeholder {
    color: rgba(255, 255, 255, 0.85);
  }
`;

type IconInputProps = {
  icon: IconDefinition;
  endSlot?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

const IconInput = forwardRef<HTMLInputElement, IconInputProps>(({ icon, endSlot, ...inputProps }, ref) => (
  <IconInputWrapper>
    <StyledIcon icon={icon} />
    <InputElement ref={ref} {...inputProps} />
    {endSlot}
  </IconInputWrapper>
));

IconInput.displayName = "IconInput";

const TogglePasswordButton = styled.button`
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover {
    color: #ffffff;
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
  width: 100%;
  border: none;
  border-radius: 999px;
  height: 52px;
  margin-top: 1rem;
  background: ${ACCENT_COLOR};
  color: #0f1323;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.02em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(84, 192, 168, 0.28);
    filter: brightness(1.05);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 8px 18px rgba(84, 192, 168, 0.18);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    filter: none;
  }
`;

const LoadingSpinner = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(15, 19, 35, 0.4);
  border-top-color: #0f1323;
  animation: ${spin} 0.6s linear infinite;
`;

type StyledLoginFormProps = Omit<FormProps<LoginFormValues>, "children"> & {
  children?: ReactNode;
};

const BaseLoginForm = (props: StyledLoginFormProps) => <Form<LoginFormValues> {...props} />;

type OnFinishFailedInfo = Parameters<NonNullable<FormProps<LoginFormValues>["onFinishFailed"]>>[0];

const StyledForm = styled(BaseLoginForm)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  height: 100%;
  gap: 16px;

  label {
    color: white !important;
    font-weight: 500;
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
  border-radius: 8px;
  background: rgba(255, 87, 87, 0.18);
  color: #ffb4b4;
  font-weight: 500;
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
  text-align: center;
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

  const handleUsernameKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      passwordInputRef.current?.focus();
    }
  }, []);

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
          message: "Inicio de sesión exitoso",
          description: "¡Bienvenido!",
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : "No se pudo iniciar sesión. Inténtalo de nuevo.";

        setFormError(errorMessage);

        notification.error({
          message: "Error",
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
      const messages = errorInfo.errorFields.flatMap(({ errors }) => errors).filter(Boolean);

      if (messages.length > 0) {
        setFormError(messages.join(" "));
        return;
      }

      setFormError("Por favor revisa los campos marcados en rojo.");
    },
    [setFormError],
  );

  return (
    <Container>
      <Wrapper>
        <StyledForm
          autoComplete="off"
          form={form}
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
              normalize={(value: string) => (typeof value === "string" ? value.toLowerCase() : value)}
              rules={[{ required: true, message: "Ingresa el nombre de usuario." }]}
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
              rules={[{ required: true, message: "Ingresa la contraseña." }]}
            >
              <IconInput
                icon={faLock}
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Contraseña"
                ref={passwordInputRef}
                endSlot={(
                  <TogglePasswordButton
                    type="button"
                    onClick={() => {
                      setIsPasswordVisible((prev) => !prev);
                      passwordInputRef.current?.focus();
                    }}
                    aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <FontAwesomeIcon icon={isPasswordVisible ? faEyeSlash : faEye} />
                  </TogglePasswordButton>
                )}
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
                Iniciando...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </SubmitButton>
        </StyledForm>
      </Wrapper>
    </Container>
  );
};
