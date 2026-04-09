import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForAdmin(_user?: any) {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility as any) as any;
  can('manage', 'all'); // el administrador puede manejar todo
  can('businessOwnershipClaimIssue', 'all');
  can('authorizationApprove', 'all');
  can('authorizationRequestsView', 'all');
  can('authorizationPinSelfGenerate', 'all');
  can('authorizationPinUsersManage', 'all');
  can('access', 'all'); // acceso a todas las rutas
  cannot('invoiceDiscountPinRequired', 'all');
  cannot('developerAccess', 'all');
  cannot('billingAccountManage', 'all');
  cannot('businessCreateUnderAccountQuota', 'all');
  can('access', '/users');
  can('access', '/users/list');
  can('access', '/users/session-logs');
  can('access', '/users/activity');
  return rules;
}
