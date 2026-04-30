import { SwapOutlined } from '@/constants/icons/antd';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AlertDialog, Button } from '@heroui/react';
import { Tag } from 'antd';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import {
  logout,
  selectUser,
  selectIsTemporaryMode,
  returnToOriginalBusiness,
} from '@/features/auth/userSlice';
import { fbStopDeveloperBusinessImpersonation } from '@/firebase/Auth/fbAuthV2/fbSwitchDeveloperBusiness';
import { fbSignOut } from '@/firebase/Auth/fbAuthV2/fbSignOut';
import type { UserIdentity } from '@/types/users';

type MenuUser = UserIdentity & {
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
  role?: string | null;
};

type BusinessData = {
  name?: string | null;
} & Record<string, unknown>;

interface UserSectionProps {
  user?: MenuUser | null;
}

export const UserSection = ({ user: userProp }: UserSectionProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const business = useSelector(selectBusinessData) as BusinessData | null;
  const storeUser = useSelector(selectUser) as MenuUser | null;
  const user = userProp ?? storeUser;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fbSignOut();
    } finally {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  };
  const getDisplayName = (user: MenuUser | null | undefined) => {
    return user?.displayName && user.displayName.trim() !== ''
      ? user.displayName
      : user?.username;
  };

  const getInitial = (name?: string | null) => {
    const n = (name || '').trim();
    return n ? n.charAt(0).toUpperCase() : 'U';
  };

  const handleReturnToOriginalBusiness = () => {
    void fbStopDeveloperBusinessImpersonation().then(
      () => {
        dispatch(returnToOriginalBusiness());
      },
      (error) => {
        console.error('No se pudo detener la impersonación en backend:', error);
        dispatch(returnToOriginalBusiness());
      },
    );
  };

  // Mostrar botón de regresar si el usuario está en modo temporal (otro negocio)
  const isTemporaryMode = useSelector(selectIsTemporaryMode);

  return (
    <>
    <Container role="group" aria-label="Usuario">
      <Left>
        <AvatarCircle aria-hidden>
          {getInitial(getDisplayName(user) || user?.email || 'Usuario')}
        </AvatarCircle>
        <Info>
          <Username title={getDisplayName(user) || 'Usuario'}>
            {getDisplayName(user) || 'Usuario'}
          </Username>
          <BusinessPill color="blue">
            <span>{business?.name || 'Negocio'}</span>
          </BusinessPill>
        </Info>
      </Left>
      <Action>
        {isTemporaryMode && (
          <IconButton
            type="button"
            aria-label="Regresar al negocio original"
            title="Regresar al negocio original"
            onClick={handleReturnToOriginalBusiness}
          >
            <SwapOutlined />
          </IconButton>
        )}
        <IconButton
          type="button"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          onClick={() => setConfirmOpen(true)}
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </IconButton>
      </Action>
    </Container>

      {createPortal(
      <AlertDialog.Backdrop
        isOpen={confirmOpen}
        onOpenChange={(open) => {
          if (!isLoggingOut) setConfirmOpen(open);
        }}
        className="z-[9999]"
        isDismissable={!isLoggingOut}
        isKeyboardDismissDisabled={isLoggingOut}
      >
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[380px]">
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>¿Cerrar sesión?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                Tu sesión actual será cerrada y tendrás que iniciar sesión
                nuevamente.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary" isDisabled={isLoggingOut}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                isDisabled={isLoggingOut}
                onPress={handleLogout}
              >
                {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
      , document.body)}
    </>
  );
};

const Container = styled.div`
  display: flex;
  gap: 0.8em;
  align-items: center;
  justify-content: space-between;
  padding: 0.8em 1em;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: var(--border-radius);
  box-shadow: 0 1px 2px rgb(0 0 0 / 5%);
`;

const Left = styled.div`
  display: flex;
  gap: 0.8em;
  align-items: center;
  min-width: 0; /* enable text truncation */
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25em;
  min-width: 0;
`;

const Username = styled.div`
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: #1f1f1f;
  text-transform: capitalize;
  white-space: nowrap;
`;

const AvatarCircle = styled.div`
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  font-weight: 600;
  color: #fff;
  user-select: none;
  background: linear-gradient(135deg, #7c4dff 0%, #8e2de2 100%);
  border-radius: 9999px;
`;

const BusinessPill = styled(Tag)`
  align-self: flex-start;
  max-width: 240px;
  padding: 4px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  border-radius: 9999px;

  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Action = styled.div`
  display: flex;
  gap: 0.5em;
  align-items: center;
  justify-content: center;
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #595959;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  transition: all 0.15s ease-in-out;

  &:hover {
    color: #262626;
    background: #f5f5f5;
  }

  &:active {
    transform: translateY(0.5px);
  }

  &:focus-visible {
    outline: 2px solid #7c4dff;
    outline-offset: 2px;
  }
`;
