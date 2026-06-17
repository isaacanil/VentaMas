import { canBaseAbility } from './baseAbility';

export const hasAuthorizationApproveAccess = (user: unknown): boolean => {
  return canBaseAbility(user, 'authorizationApprove', 'all');
};

export const hasAuthorizationRequestsViewAccess = (user: unknown): boolean => {
  return canBaseAbility(user, 'authorizationRequestsView', 'all');
};

export const hasAuthorizationPinSelfGenerateAccess = (
  user: unknown,
): boolean => {
  return canBaseAbility(user, 'authorizationPinSelfGenerate', 'all');
};

export const hasAuthorizationPinUsersManageAccess = (
  user: unknown,
): boolean => {
  return canBaseAbility(user, 'authorizationPinUsersManage', 'all');
};
