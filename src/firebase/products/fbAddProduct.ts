import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

type UserWithBusinessAndUid = UserWithBusiness & { uid: string };
type ProductWithStock = ProductRecord & { stock: number };

type CreateProductRequest = {
  businessId: string;
  product: ProductWithStock;
  sessionToken?: string;
};

type CreateProductResponse = {
  ok?: boolean;
  productId?: string;
  businessId?: string;
};

const createProductCallable = httpsCallable<
  CreateProductRequest,
  CreateProductResponse
>(functions, 'createProduct');

export const fbAddProduct = async (
  data: ProductWithStock,
  user: UserWithBusinessAndUid | null | undefined,
): Promise<void> => {
  if (!user?.businessID) return;

  const { sessionToken } = getStoredSession();
  await createProductCallable({
    businessId: user.businessID,
    product: data,
    ...(sessionToken ? { sessionToken } : {}),
  }).catch((error) => {
    console.error('Error en fbAddProduct:', error);
    throw error;
  });
};
