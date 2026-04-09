import { AbilityBuilder, PureAbility } from '@casl/ability';

export function defineAbilitiesForOwner(_user?: any) {
  const { can, cannot, rules } = new AbilityBuilder(PureAbility as any) as any;
  can('manage', 'all'); // el dueño puede manejar todo
  can('businessOwnershipClaimIssue', 'all');
  can('billingAccountManage', 'all');
  can('businessCreateUnderAccountQuota', 'all');
  can('authorizationApprove', 'all');
  can('authorizationRequestsView', 'all');
  can('authorizationPinSelfGenerate', 'all');
  can('authorizationPinUsersManage', 'all');
  can('access', 'all'); // acceso a todas las rutas
  cannot('invoiceDiscountPinRequired', 'all');
  cannot('developerAccess', 'all');
  return rules;
}
