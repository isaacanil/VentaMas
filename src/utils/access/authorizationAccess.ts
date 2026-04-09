import { PureAbility } from '@casl/ability';

import { defineAbilitiesFor } from '@/abilities';

const createAbility = (user: unknown) => {
  if (!user || typeof user !== 'object') return null;
  return new PureAbility(defineAbilitiesFor(user));
};

export const hasAuthorizationApproveAccess = (user: unknown): boolean => {
  const ability = createAbility(user);
  return ability?.can('authorizationApprove', 'all') ?? false;
};

export const hasAuthorizationRequestsViewAccess = (user: unknown): boolean => {
  const ability = createAbility(user);
  return ability?.can('authorizationRequestsView', 'all') ?? false;
};

export const hasAuthorizationPinSelfGenerateAccess = (
  user: unknown,
): boolean => {
  const ability = createAbility(user);
  return ability?.can('authorizationPinSelfGenerate', 'all') ?? false;
};

export const hasAuthorizationPinUsersManageAccess = (
  user: unknown,
): boolean => {
  const ability = createAbility(user);
  return ability?.can('authorizationPinUsersManage', 'all') ?? false;
};
