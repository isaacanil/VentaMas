import { SwapOutlined } from '@ant-design/icons';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tag } from 'antd';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { useDialog } from '@/Context/Dialog';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { logout, selectUser, selectIsTemporaryMode, returnToOriginalBusiness } from '@/features/auth/userSlice';
import { fbSignOut } from '@/firebase/Auth/fbAuthV2/fbSignOut';

export const UserSection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { onClose, setDialogConfirm } = useDialog();
  const business = useSelector(selectBusinessData);
  const user = useSelector(selectUser);

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
  const getDisplayName = (user) => {
    return user?.displayName && user.displayName.trim() !== ''
      ? user.displayName
      : user?.username;
  };

  const getInitial = (name) => {
    const n = (name || '').trim();
    return n ? n.charAt(0).toUpperCase() : 'U';
  };

  const handleReturnToOriginalBusiness = () => {
    dispatch(returnToOriginalBusiness());
  };

  // Mostrar botón de regresar si el usuario está en modo temporal (otro negocio)
  const isTemporaryMode = useSelector(selectIsTemporaryMode);

  return (
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
          onClick={logoutOfApp}
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </IconButton>
      </Action>
    </Container>
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
