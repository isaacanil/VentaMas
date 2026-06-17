import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

type UserWithBusinessAndUid = UserWithBusiness & { uid: string };
type ProductWithStock = Omit<ProductRecord, 'activeIngredients'> & {
  stock: number;
  activeIngredients?: string[] | string | null;
};

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

const createProductCallable = createFirebaseCallable<
  CreateProductRequest,
  CreateProductResponse
>('createProduct');

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
