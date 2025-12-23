import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { useDialog } from '@/Context/Dialog';
import { logout, selectUser } from '@/features/auth/userSlice';
import { fbSignOut } from '@/firebase/Auth/fbAuthV2/fbSignOut';
import ROUTES_PATH from '@/router/routes/routesName';
import PersonalizedGreeting from '@/views/pages/Home/components/PersonalizedGreeting/PersonalizedGreeting';
import { NotificationButton } from '@/views/templates/MenuApp/Components/NotificationButton/NotificationButton';

export const MenuWebsite = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { onClose, setDialogConfirm } = useDialog();
  const { GENERAL_CONFIG_BUSINESS } = ROUTES_PATH.SETTING_TERM;
  const handleSetting = () => navigate(GENERAL_CONFIG_BUSINESS);

  const handleLogout = () => {
    dispatch(logout());
    fbSignOut();
    navigate('/login', { replace: true });
  };

  const logoutOfApp = () => {
    // dispatch to the store with the logout action
    setDialogConfirm({
      title: 'Cerrar sesión',
      isOpen: true,
      type: 'warning',
      message: '¿Está seguro que desea cerrar sesión?',
      onConfirm: () => {
        handleLogout();
        onClose();
      },
    });
  };

  return (
    <Container>
      <UserSection>
        <ActionButtons>
          <StyledNotificationButton aria-label="Centro de notificaciones" />
          {user?.role !== 'cashier' && (
            <ActionIconButton
              type="button"
              aria-label="Configuración del negocio"
              onClick={handleSetting}
            >
              {icons.operationModes.setting}
            </ActionIconButton>
          )}
        </ActionButtons>
      </UserSection>

      <CenterSection>
        <BrandName>Ventamax</BrandName>
      </CenterSection>
      <GreetingSection>
        <PersonalizedGreeting />
        <ActionIconButton
          type="button"
          aria-label="Cerrar sesión"
          onClick={logoutOfApp}
        >
          {icons.operationModes.logout}
        </ActionIconButton>
      </GreetingSection>
    </Container>
  );
};
const Container = styled.header`
  position: sticky;
  top: 0.1rem;
  z-index: 100;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8em;
  row-gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  width: min(1200px, calc(100% - 2rem));
  padding: 0.3rem 0.5rem;
  margin: 0.1rem auto 0;
  color: #fff;
  background: rgb(66 164 245 / 100%);
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 100px;
  box-shadow: 0 20px 40px rgb(0 0 0 / 12%);
  backdrop-filter: blur(6px);
`;

const GreetingSection = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-start;
  order: 3;
  min-width: 200px;
`;

const CenterSection = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transform: translate(-50%, -50%);
`;

const BrandName = styled.span`
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.15rem 0.65rem;
  font-family:
    Inter,
    'Plus Jakarta Sans',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-size: clamp(1.3rem, 3vw, 1.4rem);
  font-weight: 700;
  color: rgb(255 255 255 / 92%);
  text-transform: uppercase;
  letter-spacing: 0.08em;

  @media (width <= 768px) {
    display: none;
  }
`;

const UserSection = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-start;
  order: 3;
  min-width: 180px;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  justify-content: flex-end;

  @media (width <= 768px) {
    justify-content: flex-start;
  }
`;

const iconButtonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  outline: none;
  background: rgb(15 23 42 / 20%);
  border: none;
  border-radius: 999px;
  box-shadow: 0 10px 20px rgb(15 23 42 / 18%);
  backdrop-filter: blur(10px);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;

  &:hover {
    background: rgb(255 255 255 / 22%);
    border-color: rgb(255 255 255 / 60%);
    box-shadow: 0 14px 28px rgb(15 23 42 / 24%);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: 0 8px 18px rgb(15 23 42 / 20%);
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid rgb(255 255 255 / 90%);
    outline-offset: 2px;
  }

  svg {
    font-size: 1.05rem;
  }
`;

const StyledNotificationButton = styled(NotificationButton)`
  && {
    ${iconButtonStyles}
  }
`;

const ActionIconButton = styled.button`
  ${iconButtonStyles}
`;
