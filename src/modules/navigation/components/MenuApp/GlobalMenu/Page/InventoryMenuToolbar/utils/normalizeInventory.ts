import { normalizeProductTaxes } from '@/firebase/products/fbNormalizeProductTaxes';
import { normalizeProductTrackInventory } from '@/firebase/products/fbNormalizeTrackInventory';
import type { UserWithBusiness } from '@/types/users';

type NormalizeInventorySuccess<T> = {
  status: 'success';
  summary: T;
};

type NormalizeInventoryError = {
  errorMessage: string;
  status: 'error';
};

type NormalizeInventoryResult<T> =
  | NormalizeInventorySuccess<T>
  | NormalizeInventoryError;

export const runInventoryTaxNormalization = async (
  user: UserWithBusiness,
): Promise<NormalizeInventoryResult<Awaited<ReturnType<typeof normalizeProductTaxes>>>> => {
  try {
    return {
      status: 'success',
      summary: await normalizeProductTaxes(user),
    };
  } catch (error) {
    console.error('Error al normalizar ITBIS:', error);
    return {
      errorMessage: 'No se pudo normalizar los impuestos. Intenta de nuevo.',
      status: 'error',
    };
  }
};

export const runInventoryTrackNormalization = async (
  user: UserWithBusiness,
): Promise<
  NormalizeInventoryResult<
    Awaited<ReturnType<typeof normalizeProductTrackInventory>>
  >
> => {
  try {
    return {
      status: 'success',
      summary: await normalizeProductTrackInventory(user),
    };
  } catch (error) {
    console.error('Error al normalizar trackInventory:', error);
    return {
      errorMessage: 'No se pudo normalizar el inventario. Intenta de nuevo.',
      status: 'error',
    };
  }
};
