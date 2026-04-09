import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { icons } from '@/constants/icons/icons';
import { selectUser } from '@/features/auth/userSlice';
import type { UserIdentity } from '@/types/users';

interface UserWithDisplayName extends UserIdentity {
  displayName?: string;
}

export const UserSection: React.FC = () => {
  const user = useSelector(selectUser) as UserWithDisplayName | null;
  return (
    <Container>
      <Icon>{icons.user.user}</Icon>
      {user?.displayName || user?.realName || user?.name || ''}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
`;
const Icon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6em;
  height: 1.6em;
  margin-right: 0.4em;
  font-size: 1.2em;
  color: white;
  background-color: var(--black);
  border-radius: 50%;
`;
