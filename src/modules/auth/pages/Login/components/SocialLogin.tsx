import { notification } from 'antd';
import { useState, type FC } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { applyAuthenticatedUserState } from '@/modules/auth/repositories/authState.repository';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';

import { AppleIcon, GoogleIcon, MicrosoftIcon } from './AuthIcons';
import {
  ButtonGroup,
  Container,
  LoadingSpinner,
  SocialButton,
  SocialDivider,
} from './SocialLogin.styles';
import { resolvePublicAuthVisibility } from './socialLogin.utils';
import { runGoogleProviderLogin } from './utils/socialProviderLogin';

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
        applyAuthenticatedUserState(dispatch, result.user, {
          businessHasOwners: result.businessHasOwners,
        });
        navigate(resolveDefaultHomeRoute(result.user), { replace: true });

        notification.success({
          title: 'Inicio de sesion exitoso',
          description: 'Bienvenido!',
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
          title: 'Proximamente',
          description:
            'El inicio de sesion con Microsoft estara disponible pronto.',
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
          title: 'Proximamente',
          description:
            'El inicio de sesion con Apple estara disponible pronto.',
        });
      },
      isLoading: false,
      visible: false,
    },
  ];

  const visibleProviders = loginProviders.filter(
    (provider) => provider.visible,
  );

  return (
    <Container>
      <SocialDivider plain>O continua con</SocialDivider>
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
