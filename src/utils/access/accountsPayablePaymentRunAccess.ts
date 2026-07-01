import type { ManageAccountsPayablePaymentRunAction } from '@/firebase/purchase/fbManageAccountsPayablePaymentRun';

import {
  hasAccountsPayableControlAdminAccess,
} from './accountsPayableControlAccess';
import { hasTreasuryOperatorAccess } from './treasuryOperatorAccess';

export const canManageAccountsPayablePaymentRunAction = (
  user: unknown,
  action: ManageAccountsPayablePaymentRunAction,
): boolean =>
  action === 'submit'
    ? hasTreasuryOperatorAccess(user)
    : hasAccountsPayableControlAdminAccess(user);

export const getAccountsPayablePaymentRunAccessDeniedMessage = (
  user: unknown,
  action: ManageAccountsPayablePaymentRunAction,
): string | null => {
  if (canManageAccountsPayablePaymentRunAction(user, action)) return null;

  return action === 'submit'
    ? 'Tu rol no puede enviar corridas CxP a aprobación.'
    : 'Esta acción requiere rol contable administrador.';
};
