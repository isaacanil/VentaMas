import { Divider, notification } from 'antd';
import { useState, type FC } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

import {
  updateAppState,
} from '@/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';

import { resolvePublicAuthVisibility } from './socialLogin.utils';
import { AppleIcon, GoogleIcon, MicrosoftIcon } from './AuthIcons';
import { runGoogleProviderLogin } from './utils/socialProviderLogin';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
`;

type SocialLoginProps = {
  setLoading?: (value: boolean) => void;
  forceVisible?: boolean;
};

export const SocialLogin: FC<SocialLoginProps> = ({
  setLoading,
  forceVisible = false,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shouldRender = resolvePublicAuthVisibility(location.search);

  const handleGoogleLogin = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setLoading?.(true);

    void runGoogleProviderLogin().then((result) => {
      if (result.status === 'success') {
        updateAppState(dispatch, {
          ...result.user,
          businessHasOwners: result.businessHasOwners,
        });
        navigate(resolveDefaultHomeRoute(result.user), { replace: true });

        notification.success({
          title: 'Inicio de sesión exitoso',
          description: '¡Bienvenido!',
        });
      } else {
        notification.error({
          title: 'Error',
          description: result.errorMessage,
        });
      }

      setLoading?.(false);
      setIsSubmitting(false);
    });
  };

  if (!forceVisible && !shouldRender) {
    return null;
  }

  const loginProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: <GoogleIcon />,
      action: () => {
        void handleGoogleLogin();
      },
      isLoading: isSubmitting,
      visible: true,
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      icon: <MicrosoftIcon />,
      action: () => {
        notification.info({
          title: 'Próximamente',
          description:
            'El inicio de sesión con Microsoft estará disponible pronto.',
        });
      },
      isLoading: false,
      visible: false,
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: <AppleIcon />,
      action: () => {
        notification.info({
          title: 'Próximamente',
          description:
            'El inicio de sesión con Apple estará disponible pronto.',
        });
      },
      isLoading: false,
      visible: false,
    },
  ];

  const visibleProviders = loginProviders.filter((p) => p.visible);

  return (
    <Container>
      <Divider
        plain
        style={{
          borderColor: 'rgb(255 255 255 / 12%)',
          color: 'rgb(255 255 255 / 40%)',
          margin: '1.25rem 0 0.5rem',
          fontSize: '0.85rem',
          fontWeight: 500,
        }}
      >
        O continúa con
      </Divider>
      <ButtonGroup>
        {visibleProviders.map((provider) => (
          <SocialButton
            key={provider.id}
            type="button"
            onClick={provider.action}
            disabled={isSubmitting}
          >
            {provider.isLoading ? (
              <>
                <LoadingSpinner />
                Cargando...
              </>
            ) : (
              <>
                {provider.icon}
                {provider.name}
              </>
            )}
          </SocialButton>
        ))}
      </ButtonGroup>
    </Container>
  );
};

export default SocialLogin;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.span`
  display: inline-block;
  width: 1.1em;
  height: 1.1em;
  border: 2px solid rgb(255 255 255 / 20%);
  border-top-color: currentcolor;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
  vertical-align: middle;
  flex-shrink: 0;
`;

const SocialButton = styled.button`
  display: inline-flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.01em;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 999px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background-color: rgb(255 255 255 / 5%);
    border-color: rgb(255 255 255 / 30%);
    transform: translateY(-1px);
  }

  &:active {
    background-color: rgb(255 255 255 / 8%);
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }

  svg {
    flex-shrink: 0;
  }
`;
