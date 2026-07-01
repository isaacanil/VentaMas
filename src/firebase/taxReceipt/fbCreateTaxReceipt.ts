import type { TaxReceiptData, TaxReceiptUser } from '@/types/taxReceipt';
import { validateUser } from '@/utils/userValidation';

import { addTaxReceipt } from './addTaxReceipt';

export const fbCreateTaxReceipt = async (
  taxReceipt: TaxReceiptData,
  user: TaxReceiptUser,
) => {
  try {
    validateUser(user);
    return await addTaxReceipt(user, taxReceipt);
  } catch (err) {
    console.error('Error creating tax receipt:', err);
    return undefined;
  }
};
