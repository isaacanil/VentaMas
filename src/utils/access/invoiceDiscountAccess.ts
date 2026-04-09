import { PureAbility } from '@casl/ability';

import { defineAbilitiesFor } from '@/abilities';

export const requiresInvoiceDiscountPinAuthorization = (
  user: unknown,
): boolean => {
  if (!user || typeof user !== 'object') return false;

  const ability = new PureAbility(defineAbilitiesFor(user));
  return ability.can('invoiceDiscountPinRequired', 'all');
};
