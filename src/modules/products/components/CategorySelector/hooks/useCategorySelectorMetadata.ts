import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { useGetFavoriteProductCategories } from '@/firebase/categories/fbGetFavoriteProductCategories';
import { fbToggleFavoriteProductCategory } from '@/firebase/categories/fbToggleFavoriteProductCategory';
import { useFbGetCategories } from '@/firebase/categories/useFbGetCategories';
import type {
  CategoryDocument,
  CategoryRecord,
} from '@/firebase/categories/types';
import { useListenActiveIngredients } from '@/firebase/products/activeIngredient/activeIngredients';
import type { UserIdentity } from '@/types/users';

export type { CategoryDocument, CategoryRecord };

type UserWithBusinessAndUid = UserIdentity & {
  businessID: string;
  uid: string;
};

export const useCategorySelectorMetadata = () => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const { categories } = useFbGetCategories() as {
    categories: CategoryDocument[];
  };
  const { favoriteCategories } = useGetFavoriteProductCategories();
  const { data: activeIngredients = [] } =
    useListenActiveIngredients() as unknown as {
      data?: CategoryRecord[];
    };

  const handleToggleCategoryFavorite = useCallback(
    async (category: CategoryRecord) => {
      await fbToggleFavoriteProductCategory(
        user as UserWithBusinessAndUid,
        category,
      );
    },
    [user],
  );

  return {
    activeIngredients,
    categories,
    favoriteCategories,
    handleToggleCategoryFavorite,
  };
};
