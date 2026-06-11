import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { selectAuthReady, selectUser } from '@/features/auth/userSlice';
import ROUTES_NAME from '@/router/routes/routesName';
import type { UserIdentity } from '@/types/users';

interface RequireAuthProps {
  children: ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const authReady = useSelector(selectAuthReady);

  if (!authReady) return null;
  if (!user) return <Navigate to={ROUTES_NAME.AUTH_TERM.LOGIN} replace />;
  return <>{children}</>;
};
