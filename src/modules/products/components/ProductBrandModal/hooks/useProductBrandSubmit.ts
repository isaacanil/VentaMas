import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import {
  fbAddProductBrand,
  fbUpdateProductBrand,
} from '@/firebase/products/brands/productBrands';
import type { UserWithBusiness } from '@/types/users';

export type BrandRecord = {
  id?: string;
  name?: string;
};

export type BrandFormValues = {
  name: string;
};

export const useProductBrandSubmit = () => {
  const user = useSelector(selectUser) as UserWithBusiness | null;

  const saveProductBrand = useCallback(
    async (values: BrandFormValues, initialValues: BrandRecord | null) => {
      if (!user?.businessID) {
        return;
      }

      if (initialValues) {
        await fbUpdateProductBrand(user, {
          id: initialValues.id,
          name: values.name,
        });
        return;
      }

      await fbAddProductBrand(user, { name: values.name });
    },
    [user],
  );

  return {
    hasBusiness: Boolean(user?.businessID),
    saveProductBrand,
  };
};
