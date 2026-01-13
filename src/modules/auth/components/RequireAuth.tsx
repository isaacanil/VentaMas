import { useEffect, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '@/features/auth/userSlice';
import type { UserIdentity } from '@/types/users';

interface RequireAuthProps {
  children: ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return user ? children : null;
};
