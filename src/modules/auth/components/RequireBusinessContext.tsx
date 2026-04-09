import { useEffect, useMemo, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { addUserData, selectAuthReady, selectUser } from '@/features/auth/userSlice';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import ROUTES_PATH from '@/router/routes/routesName';
import type { UserIdentity } from '@/types/users';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import {
  buildAccessControlFromBusinesses,
  normalizeAvailableBusinesses,
  resolveBusinessPreferenceId,
  resolveAutoSelectedBusiness,
  resolveCurrentActiveBusinessId,
  resolveCurrentActiveRole,
  setStoredActiveBusinessId,
} from '@/modules/auth/utils/businessContext';

interface RequireBusinessContextProps {
  children: ReactNode;
}

/**
 * @deprecated La resolución/redirección principal de contexto de negocio ya vive en
 * `protectedRouteLoader` (React Router Data Loader). Este componente quedó legacy
 * y actualmente no tiene usos en `src/`.
 */
export const RequireBusinessContext = ({
  children,
}: RequireBusinessContextProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authReady = useSelector(selectAuthReady);
  const user = useSelector(selectUser) as (UserIdentity & Record<string, unknown>) | null;

  const selectorPath =
    ROUTES_PATH.AUTH_TERM.SELECT_BUSINESS || '/hub';
  const defaultHomePath = resolveDefaultHomeRoute(user);
  const isSelectorPath = location.pathname === selectorPath;
  const isDeveloperUser = hasDeveloperAccess(user);

  const availableBusinesses = useMemo(
    () => normalizeAvailableBusinesses(user),
    [user],
  );
  const hasMultipleBusinesses = availableBusinesses.length > 1;
  const activeOptionsCount = useMemo(
    () =>
      availableBusinesses.filter((business) => business.isActive).length ||
      availableBusinesses.length,
    [availableBusinesses],
  );
  const businessPreferenceId = resolveBusinessPreferenceId(user);
  const activeBusinessId = resolveCurrentActiveBusinessId(user);
  const activeBusiness = useMemo(
    () =>
      availableBusinesses.find(
        (business) => business.businessId === activeBusinessId,
      ) || null,
    [availableBusinesses, activeBusinessId],
  );
  const autoSelectedBusiness = useMemo(
    () =>
      activeBusiness
        ? null
        : resolveAutoSelectedBusiness(user, availableBusinesses),
    [activeBusiness, availableBusinesses, user],
  );
  const requiresBusinessSelection =
    hasMultipleBusinesses && activeOptionsCount > 1 && !businessPreferenceId;

  useEffect(() => {
    if (!authReady || !user) return;

    // Allow manual business switching and account/payment center access.
    // /hub stays reachable even with a single active business.
    if (isSelectorPath) {
      return;
    }

    if (activeBusiness && !requiresBusinessSelection) {
      setStoredActiveBusinessId(activeBusiness.businessId);

      if (isSelectorPath) {
        navigate(defaultHomePath, { replace: true });
      }
      return;
    }

    if (autoSelectedBusiness) {
      const currentRole = resolveCurrentActiveRole(user);
      const needsStateUpdate =
        activeBusinessId !== autoSelectedBusiness.businessId ||
        currentRole !== autoSelectedBusiness.role ||
        !Array.isArray(user.availableBusinesses) ||
        user.hasMultipleBusinesses !== hasMultipleBusinesses;

      if (needsStateUpdate) {
        dispatch(
          addUserData({
            businessID: autoSelectedBusiness.businessId,
            businessId: autoSelectedBusiness.businessId,
            activeBusinessId: autoSelectedBusiness.businessId,
            ...(!isDeveloperUser
              ? {
                role: autoSelectedBusiness.role,
                activeRole: autoSelectedBusiness.role,
              }
              : {}),
            activeBusinessRole: autoSelectedBusiness.role,
            lastSelectedBusinessId: autoSelectedBusiness.businessId,
            hasMultipleBusinesses,
            availableBusinesses,
            accessControl: buildAccessControlFromBusinesses(availableBusinesses),
          }),
        );
      }

      setStoredActiveBusinessId(autoSelectedBusiness.businessId);

      if (isSelectorPath) {
        navigate(defaultHomePath, { replace: true });
      }
      return;
    }

    if (!isSelectorPath) {
      navigate(selectorPath, { replace: true });
    }
  }, [
    authReady,
    user,
    activeBusiness,
    autoSelectedBusiness,
    activeBusinessId,
    hasMultipleBusinesses,
    activeOptionsCount,
    businessPreferenceId,
    requiresBusinessSelection,
    availableBusinesses,
    dispatch,
    navigate,
    defaultHomePath,
    selectorPath,
    isSelectorPath,
    isDeveloperUser,
  ]);

  if (!authReady) return null;
  if (!user) return null;
  if (isSelectorPath) {
    return <>{children}</>;
  }

  // While we resolve/redirect business context, prevent flashing protected pages.
  if (requiresBusinessSelection && !isSelectorPath) {
    return null;
  }
  if (!activeBusiness && !autoSelectedBusiness && !isSelectorPath) {
    return null;
  }
  return <>{children}</>;
};

export default RequireBusinessContext;
