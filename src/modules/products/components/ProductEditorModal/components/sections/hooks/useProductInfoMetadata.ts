import { useFbGetCategories } from '@/firebase/categories/useFbGetCategories';
import { useListenActiveIngredients } from '@/firebase/products/activeIngredient/activeIngredients';
import type { ActiveIngredient } from '@/types/products';

type CategoryRecord = {
  category?: { name?: string };
} & Record<string, unknown>;

export const useProductInfoMetadata = () => {
  const { categories } = useFbGetCategories() as {
    categories: CategoryRecord[];
  };
  const { data: activeIngredients = [] } = useListenActiveIngredients() as {
    data?: ActiveIngredient[];
  };

  return {
    activeIngredients,
    categories,
  };
};
