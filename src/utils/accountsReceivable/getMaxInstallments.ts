import type { AccountsReceivablePaymentFrequency } from '@/utils/accountsReceivable/types';

export const getMaxInstallments = (
  frecuencia: AccountsReceivablePaymentFrequency,
): number => {
  switch (frecuencia) {
    case 'monthly':
      return 36; // 24 a 36 meses
    case 'weekly':
      return 104; // 52 a 104 semanas
    default:
      return 36; // Valor por defecto si no se especifica la frecuencia
  }
};
