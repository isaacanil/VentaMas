export { GeneratePinModal } from './components/pinManagement/GeneratePinModal';
export { useAuthorizationModules } from './hooks/useAuthorizationModules';
export { useAuthorizationPin } from './hooks/useAuthorizationPin';
export { PinAuthorizationModal } from './components/PinAuthorizationModal/PinAuthorizationModal';
export { PinDetailsModal } from './components/pinManagement/PinDetailsModal';
export { resolveModuleMeta } from './utils/moduleMeta';

export const loadAuthorizationsManagerRoute = () =>
  import('./pages/Authorizations/AuthorizationsManager').then((module) => ({
    default: module.AuthorizationsManager,
  }));
