import { canBaseAbility } from './baseAbility';

export const requiresInvoiceDiscountPinAuthorization = (
  user: unknown,
): boolean => {
  return canBaseAbility(user, 'invoiceDiscountPinRequired', 'all');
};
