import { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  addItem,
  deleteAllItems,
  SelectCategoryList,
  SelectCategoryState,
} from '@/features/category/categorySlicer';
import { useGetFavoriteProductCategories } from '@/firebase/categories/fbGetFavoriteProductCategories';
import { fbToggleFavoriteProductCategory } from '@/firebase/categories/fbToggleFavoriteProductCategory';
import { useFbGetCategories } from '@/firebase/categories/useFbGetCategories';
import type {
  CategoryDocument,
  CategoryRecord,
} from '@/firebase/categories/types';
import { useListenActiveIngredients } from '@/firebase/products/activeIngredient/activeIngredients';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import { filterFavoriteProductCategories } from '@/utils/data/products/category';
import type { UserIdentity } from '@/types/users';

import { CategoryBar } from './components/CategoryBar/CategoryBar';
import { DropdownMenu } from './components/DropdownMenu/DropdownMenu';

type CategorySelectionItem = {
  id: string;
  name: string;
  type: 'category' | 'activeIngredient';
};

type UserWithBusinessAndUid = UserIdentity & {
  businessID: string;
  uid: string;
};

interface CategoryListItem {
  id?: string;
  name?: string;
  isFavorite: boolean;
  selected: boolean;
  [key: string]: unknown;
}

const transformCategoriesToItems = (
  categoriesToTransform: CategoryDocument[],
): CategoryListItem[] =>
  categoriesToTransform.map((item) => {
    const { name, id } = item.category;
    return {
      id,
      name,
      isFavorite: false,
      selected: false,
    };
  });

const separateCategories = (
  allCategories: CategoryDocument[],
  favoriteCategoryDocs: CategoryDocument[],
): { favorites: CategoryListItem[]; normals: CategoryListItem[] } => {
  const favoriteIds = new Set(
    transformCategoriesToItems(favoriteCategoryDocs).map((item) => item.id),
  );
  const favorites: CategoryListItem[] = [];
  const normals: CategoryListItem[] = [];

  transformCategoriesToItems(allCategories).forEach((category) => {
    const categoryWithFavoriteState = {
      ...category,
      isFavorite: favoriteIds.has(category.id),
    };

    if (categoryWithFavoriteState.isFavorite) {
      favorites.push(categoryWithFavoriteState);
      return;
    }

    normals.push(categoryWithFavoriteState);
  });

  return { favorites, normals };
};

const markSelectedItems = <T extends { id?: string }>(
  itemsToMark: T[],
  selectedItems: CategorySelectionItem[],
): Array<T & { selected: boolean }> => {
  const selectedIds = new Set(selectedItems.map((item) => item.id));

  return itemsToMark.map((item) => ({
    ...item,
    selected: selectedIds.has(item.id ?? ''),
  }));
};

export const CategorySelector = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const { categories } = useFbGetCategories() as {
    categories: CategoryDocument[];
  };
  const favoriteProductCategoryArray = useGetFavoriteProductCategories();
  const categoriesSelected = useSelector(
    SelectCategoryList,
  ) as CategorySelectionItem[];
  const { data: activeIngredients = [] } = useListenActiveIngredients() as {
    data?: CategoryRecord[];
  };
  const { items } = useSelector(SelectCategoryState) as {
    items: CategorySelectionItem[];
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useClickOutSide(containerRef, open === true, () => setOpen(false));

  const favoriteCategories = useMemo(
    () =>
      filterFavoriteProductCategories(
        categories,
        favoriteProductCategoryArray.favoriteCategories,
      ),
    [categories, favoriteProductCategoryArray.favoriteCategories],
  );
  const { favorites, normals } = useMemo(
    () => separateCategories(categories, favoriteCategories),
    [categories, favoriteCategories],
  );
  const markedFavorites = useMemo(
    () => markSelectedItems(favorites, categoriesSelected),
    [favorites, categoriesSelected],
  );
  const markedNormals = useMemo(
    () => markSelectedItems(normals, categoriesSelected),
    [normals, categoriesSelected],
  );
  const markedActiveIngredients = useMemo(
    () => markSelectedItems(activeIngredients, categoriesSelected),
    [activeIngredients, categoriesSelected],
  );

  const handleDeleteAllItems = useCallback(
    () => dispatch(deleteAllItems()),
    [dispatch],
  );
  const handleAddCategory = useCallback(
    (category: CategoryListItem) =>
      dispatch(addItem({ ...category, type: 'category' } as CategorySelectionItem)),
    [dispatch],
  );
  const handleAddActiveIngredient = useCallback(
    (activeIngredient: CategoryListItem) =>
      dispatch(
        addItem({
          ...activeIngredient,
          type: 'activeIngredient',
        } as CategorySelectionItem),
      ),
    [dispatch],
  );

  const sectionsConfig = useMemo(
    () => ({
      favoriteCategories: {
        title: 'Categorías Favoritas',
        items: markedFavorites,
        color: '#fff7c9',
        onSelect: handleAddCategory,
        onToggleFavorite: handleToggleCategoryFavorite,
      },
      categories: {
        title: 'Categorías',
        items: markedNormals,
        color: '#fff7c9',
        onSelect: handleAddCategory,
        onToggleFavorite: handleToggleCategoryFavorite,
      },
      activeIngredients: {
        title: 'Principio Activo',
        color: '#d3ffd2',
        items: markedActiveIngredients,
        onSelect: handleAddActiveIngredient,
      },
    }),
    [
      handleAddActiveIngredient,
      handleAddCategory,
      handleToggleCategoryFavorite,
      markedActiveIngredients,
      markedFavorites,
      markedNormals,
    ],
  );

  return (
    <Container ref={containerRef}>
      <CategoryBar open={open} setOpen={setOpen} items={items} />
      {open && (
        <DropdownMenu
          ref={containerRef}
          setOpen={setOpen}
          sectionsConfig={sectionsConfig}
          deleteAllItems={handleDeleteAllItems}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;

  /* estilos para el contenedor principal */
`;
