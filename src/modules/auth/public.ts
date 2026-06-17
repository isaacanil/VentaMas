export { ClaimOwnershipModal } from './components/ClaimOwnershipModal';
export { RequireAuth } from './components/RequireAuth';
export { SessionExpiredAlertDialog } from './components/SessionExpiredAlertDialog/SessionExpiredAlertDialog';
export { useAutomaticLogin } from './hooks/useAutomaticLogin';
export { useBusinessDataConfig } from './hooks/useBusinessDataConfig';
export { useBusinessMetadata } from './hooks/useBusinessMetadata';
export { useUserDocListener } from './hooks/useUserDocListener';
export {
  buildAccessControlFromBusinesses,
  normalizeAvailableBusinesses,
  resolveAutoSelectedBusiness,
  resolveBusinessPreferenceId,
  resolveCurrentActiveBusinessId,
  resolveCurrentActiveRole,
  setStoredActiveBusinessId,
} from './utils/businessContext';
export {
  resolveBusinessDevIdLabel,
  resolveBusinessDisplayName,
} from './utils/businessDisplay';
export {
  hasBusinessManagerQuery,
  withBusinessManagerQuery,
  withoutBusinessManagerQuery,
} from './utils/businessManagerRoute';
export { resolveDefaultHomeRoute } from './utils/defaultHomeRoute';

export const loadClaimBusinessRoute = () =>
  import('./pages/ClaimBusinessPage/ClaimBusinessPage').then((module) => ({
    default: module.ClaimBusinessPage,
  }));

export const loadLoginRoute = () =>
  import('./pages/Login/Login').then((module) => ({
    default: module.Login,
  }));

export const loadSignUpRoute = () =>
  import('./pages/SignUp/SignUp').then((module) => ({
    default: module.SignUp,
  }));
