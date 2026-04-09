import React from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/features/auth/userSlice';
import type { UserIdentity } from '@/types/users';

interface UserWithDisplayName extends UserIdentity {
  displayName?: string;
}

export const UserSection: React.FC = () => {
  const user = useSelector(selectUser) as UserWithDisplayName | null;
  return (
    <div>
      Usuario: {user?.displayName || user?.realName || user?.name || ''}
    </div>
  );
};
