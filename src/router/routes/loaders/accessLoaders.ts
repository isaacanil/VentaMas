import { redirect, type LoaderFunctionArgs } from 'react-router';

import { store } from '@/app/store';
import { addUserData, selectAuthReady, selectUser } from '@/features/auth/userSlice';
import {
  buildAccessControlFromBusinesses,
  normalizeAvailableBusinesses,
  resolveAutoSelectedBusiness,
  resolveBusinessPreferenceId,
  resolveCurrentActiveBusinessId,
  resolveCurrentActiveRole,
  setStoredActiveBusinessId,
} from '@/modules/auth/utils/businessContext';
import {
  hasBusinessManagerQuery,
  withBusinessManagerQuery,
} from '@/modules/auth/utils/businessManagerRoute';
import { resolveDefaultHomeRoute } from '@/modules/auth/utils/defaultHomeRoute';
import { getRouteMeta } from '@/router/routes/routeVisibility';
import ROUTES_NAME from '@/router/routes/routesName';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';
import { hasManageAllAccess } from '@/utils/access/manageAllAccess';
import { hasRequiredCapabilitiesAccess } from '@/utils/access/routeCapabilities';

import type { AvailableBusinessContext } from '@/utils/auth-adapter';

type SelectedAuthUser = ReturnType<typeof selectUser>;
type AuthUser = NonNullable<SelectedAuthUser>;

type AuthSnapshot = {
  authReady: boolean;
  user: SelectedAuthUser;
};

const readAuthSnapshot = (): AuthSnapshot => {
  const state = store.getState();
  return {
    authReady: selectAuthReady(state),
    user: selectUser(state),
  };
};

const applyAutoSelectedBusiness = ({
  user,
  business,
  availableBusinesses,
}: {
  user: AuthUser;
  business: AvailableBusinessContext;
  availableBusinesses: AvailableBusinessContext[];
}) => {
  const isDeveloperUser = hasDeveloperAccess(user);
  store.dispatch(
    addUserData({
      businessID: business.businessId,
      businessId: business.businessId,
      activeBusinessId: business.businessId,
      ...(!isDeveloperUser
        ? {
            role: business.role,
            activeRole: business.role,
          }
        : {}),
      activeBusinessRole: business.role,
      lastSelectedBusinessId: business.businessId,
      hasMultipleBusinesses: availableBusinesses.length > 1,
      availableBusinesses,
      accessControl: buildAccessControlFromBusinesses(availableBusinesses),
    }),
  );
  setStoredActiveBusinessId(business.businessId);
};

type LoaderRedirectResult = ReturnType<typeof redirect> | null;

type ProtectedRouteAccessRedirectArgs = {
  user: AuthUser;
  pathname: string;
  preserveSearch: string;
  defaultHomePath: string;
  isDeveloperUser: boolean;
  isOwnerUser: boolean;
};

const resolveProtectedRouteAccessRedirect = ({
  user,
  pathname,
  preserveSearch,
  defaultHomePath,
  isDeveloperUser,
  isOwnerUser,
}: ProtectedRouteAccessRedirectArgs): LoaderRedirectResult => {
  const homePath = ROUTES_NAME.BASIC_TERM.HOME;
  const developerHubPath = ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB;
  const createBusinessPath = ROUTES_NAME.DEV_VIEW_TERM.CREATE_BUSINESS;
  const routeMeta = getRouteMeta(pathname);
  const isCreateBusinessPath = pathname === createBusinessPath;

  if (pathname === homePath && isDeveloperUser) {
    return redirect(`${developerHubPath}${preserveSearch}`);
  }

  if (isCreateBusinessPath) {
    const availableBusinesses = normalizeAvailableBusinesses(user);
    const hasBusinesses = availableBusinesses.length > 0;
    if (!isDeveloperUser && !isOwnerUser && hasBusinesses) {
      return redirect(defaultHomePath);
    }
    return null;
  }

  if (routeMeta?.requiresDevAccess) {
    if (!isDeveloperUser) {
      return redirect(defaultHomePath);
    }
    return null;
  }

  if (routeMeta?.requiresManageAllAccess) {
    if (!hasManageAllAccess(user)) {
      return redirect(defaultHomePath);
    }
    return null;
  }

  if (Array.isArray(routeMeta?.requiredCapabilities) && routeMeta.requiredCapabilities.length) {
    const hasCapabilities = hasRequiredCapabilitiesAccess({
      user,
      requiredCapabilities: routeMeta.requiredCapabilities,
      mode: routeMeta.requiredCapabilitiesMode ?? 'any',
    });
    if (!hasCapabilities) {
      return redirect(defaultHomePath);
    }
    return null;
  }

  return null;
};

type BusinessSelectionState = {
  availableBusinesses: AvailableBusinessContext[];
  activeBusiness: AvailableBusinessContext | null;
  autoSelectedBusiness: AvailableBusinessContext | null;
  requiresBusinessSelection: boolean;
};

const resolveBusinessSelectionState = (user: AuthUser): BusinessSelectionState => {
  const availableBusinesses = normalizeAvailableBusinesses(user);
  const hasMultipleBusinesses = availableBusinesses.length > 1;
  const activeOptionsCount =
    availableBusinesses.filter((business) => business.isActive).length ||
    availableBusinesses.length;
  const businessPreferenceId = resolveBusinessPreferenceId(user);
  const activeBusinessId = resolveCurrentActiveBusinessId(user);
  const activeBusiness =
    availableBusinesses.find(
      (business) => business.businessId === activeBusinessId,
    ) || null;
  const autoSelectedBusiness = activeBusiness
    ? null
    : resolveAutoSelectedBusiness(user, availableBusinesses);
  const requiresBusinessSelection =
    hasMultipleBusinesses && activeOptionsCount > 1 && !businessPreferenceId;

  return {
    availableBusinesses,
    activeBusiness,
    autoSelectedBusiness,
    requiresBusinessSelection,
  };
};

type BusinessManagerRedirectArgs = {
  pathname: string;
  search: string;
  defaultHomePath: string;
  defaultHomeWithBusinessManager: string;
  requiresBusinessSelection: boolean;
  hasActiveBusiness: boolean;
  skipRedirect?: boolean;
};

const resolveBusinessManagerRedirect = ({
  pathname,
  search,
  defaultHomePath,
  defaultHomeWithBusinessManager,
  requiresBusinessSelection,
  hasActiveBusiness,
  skipRedirect = false,
}: BusinessManagerRedirectArgs): LoaderRedirectResult => {
  if (skipRedirect) {
    return null;
  }

  if (!requiresBusinessSelection && hasActiveBusiness) {
    return null;
  }

  const isOnDefaultHomePath = pathname === defaultHomePath;
  const hasManagerQuery = hasBusinessManagerQuery(search);
  if (!isOnDefaultHomePath || !hasManagerQuery) {
    return redirect(defaultHomeWithBusinessManager);
  }

  return null;
};

export const redirectAuthenticatedToDefaultLoader = () => {
  const { authReady, user } = readAuthSnapshot();
  if (!authReady || !user) return null;
  return redirect(resolveDefaultHomeRoute(user));
};

export const protectedRouteLoader = ({ request }: LoaderFunctionArgs) => {
  const { authReady, user } = readAuthSnapshot();
  if (!authReady) return null;
  if (!user) return redirect(ROUTES_NAME.AUTH_TERM.LOGIN);

  const requestUrl = new URL(request.url);
  const { pathname, search } = requestUrl;
  const createBusinessPath = ROUTES_NAME.DEV_VIEW_TERM.CREATE_BUSINESS;
  const isCreateBusinessPath = pathname === createBusinessPath;
  const preserveSearch = search || '';
  const isDeveloperUser = hasDeveloperAccess(user);
  const defaultHomePath = resolveDefaultHomeRoute(user);
  const isOwnerUser = resolveCurrentActiveRole(user) === 'owner';
  const accessRedirect = resolveProtectedRouteAccessRedirect({
    user,
    pathname,
    preserveSearch,
    defaultHomePath,
    isDeveloperUser,
    isOwnerUser,
  });
  if (accessRedirect) {
    return accessRedirect;
  }

  const defaultHomeWithBusinessManager = withBusinessManagerQuery(defaultHomePath);
  const {
    availableBusinesses,
    activeBusiness,
    autoSelectedBusiness,
    requiresBusinessSelection,
  } = resolveBusinessSelectionState(user);

  if (!activeBusiness && autoSelectedBusiness) {
    applyAutoSelectedBusiness({
      user,
      business: autoSelectedBusiness,
      availableBusinesses,
    });
    return null;
  }

  const businessManagerRedirect = resolveBusinessManagerRedirect({
    pathname,
    search,
    defaultHomePath,
    defaultHomeWithBusinessManager,
    requiresBusinessSelection,
    hasActiveBusiness: Boolean(activeBusiness),
    skipRedirect: isCreateBusinessPath,
  });
  if (businessManagerRedirect) {
    return businessManagerRedirect;
  }

  if (activeBusiness) {
    setStoredActiveBusinessId(activeBusiness.businessId);
    return null;
  }
  return null;
};
