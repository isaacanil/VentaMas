import { Button } from 'antd';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { toggleSignUpUser } from '@/features/modals/modalSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

const UsersAdminToolbar = ({ side = 'left' }: ToolbarComponentProps) => {
  const dispatch = useDispatch();
  const { abilities } = useUserAccess();

  const handleOpenModal = () => dispatch(toggleSignUpUser({ isOpen: true }));
  const matchWithUsers = useMatch('/users/list');
  const canCreateUsers =
    abilities.can('create', 'User') || abilities.can('manage', 'User');

  return matchWithUsers && canCreateUsers ? (
    <Container>
      {side === 'right' && (
        <Button onClick={handleOpenModal} icon={icons.operationModes.add}>
          Usuario
        </Button>
      )}
    </Container>
  ) : null;
};

export default UsersAdminToolbar;

const Container = styled.div``;
