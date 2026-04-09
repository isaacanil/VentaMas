import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForDev(_user?: any) {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility as any) as any;
  can('developerAccess', 'all'); // acceso total para el desarrollador
  can('businessOwnershipClaimIssue', 'all');
  can('billingAccountManage', 'all');
  can('businessCreateUnderAccountQuota', 'all');
  can('authorizationApprove', 'all');
  can('authorizationRequestsView', 'all');
  can('authorizationPinSelfGenerate', 'all');
  can('authorizationPinUsersManage', 'all');
  can('manage', 'all'); // el dev puede manejar todo
  cannot('invoiceDiscountPinRequired', 'all');
  can('access', 'all'); // acceso a todas las rutas
  can('access', '/users');
  can('access', '/users/list');
  can('access', '/users/session-logs');
  can('access', '/users/activity');
  return rules;
}
