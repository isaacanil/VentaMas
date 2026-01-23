import { useRef, useState } from 'react';
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
import type { CategoryDocument, CategoryRecord } from '@/firebase/categories/types';
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

export const CategorySelector = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const { categories } = useFbGetCategories() as {
    categories: CategoryDocument[];
  };
  const favoriteProductCategoryArray = useGetFavoriteProductCategories();
  const categoriesSelected = useSelector(SelectCategoryList) as CategorySelectionItem[];
  const favoriteCategories = filterFavoriteProductCategories(
    categories,
    favoriteProductCategoryArray.favoriteCategories,
  );
  const { data: activeIngredients = [] } = useListenActiveIngredients() as {
    data?: CategoryRecord[];
  };
  const { items } = useSelector(SelectCategoryState) as {
    items: CategorySelectionItem[];
  };
  const handleToggleCategoryFavorite = async (category: CategoryRecord) => {
    await fbToggleFavoriteProductCategory(user as UserWithBusinessAndUid, category);
  };
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useClickOutSide(containerRef, open === true, () => setOpen(false));

  function transformCategoriesToItems(
    categoriesToTransform: CategoryDocument[],
  ): CategoryListItem[] {
    return categoriesToTransform.map((item) => {
      const { name, id } = item.category;
      return {
        id: id, // Usamos el id principal (puede ser el id de la categoría si prefieres)
        name: name, // Usamos el nombre de la categoría
        isFavorite: false, // Valor predeterminado, puedes ajustarlo si hay un indicador real
        selected: false, // Valor predeterminado para saber si está seleccionado
      };
    });
  }
  function markFavorites(
    categoriesToMark: CategoryListItem[],
    favoriteCategoryItems: CategoryListItem[],
  ): CategoryListItem[] {
    return categoriesToMark.map((category) => {
      const isFavorite = favoriteCategoryItems.some(
        (fav) => fav.id === category.id,
      ); // Verifica si es favorita
      return {
        ...category,
        isFavorite: isFavorite, // Actualiza el estado de favorito
      };
    });
  }
  function separateCategories(
    allCategories: CategoryDocument[],
    favoriteCategoryDocs: CategoryDocument[],
  ): { favorites: CategoryListItem[]; normals: CategoryListItem[] } {
    // Primero transformamos las categorías
    const transformedCategories = transformCategoriesToItems(allCategories);
    const transformedFavoriteCategories =
      transformCategoriesToItems(favoriteCategoryDocs);

    // Luego marcamos las favoritas
    const markedCategories = markFavorites(
      transformedCategories,
      transformedFavoriteCategories,
    );

    // Separamos en favoritas y normales
    const favorites = [];
    const normals = [];

    markedCategories.forEach((category) => {
      if (category.isFavorite) {
        favorites.push(category);
      } else {
        normals.push(category);
      }
    });

    return { favorites, normals }; // Retornamos ambas listas
  }
  function markSelectedItems<T extends { id?: string }>(
    itemsToMark: T[],
    selectedItems: CategorySelectionItem[],
  ): Array<T & { selected: boolean }> {
    return itemsToMark.map((item) => {
      const isSelected = selectedItems.some(
        (selected) => selected.id === item.id,
      ); // Verifica si ya está seleccionada
      return {
        ...item,
        selected: isSelected, // Marca como seleccionada si ya está en la lista de seleccionados
      };
    });
  }

  const { favorites, normals } = separateCategories(
    categories,
    favoriteCategories,
  );
  // Luego, marcas las categorías normales y favoritas como seleccionadas
  const markedFavorites = markSelectedItems(favorites, categoriesSelected);
  const markedNormals = markSelectedItems(normals, categoriesSelected);

  // Luego, marcas los principios activos como seleccionados
  const markedActiveIngredients = markSelectedItems(
    activeIngredients,
    categoriesSelected,
  );

  const handleDeleteAllItems = () => dispatch(deleteAllItems());
  const handleAddCategory = (category: CategoryListItem) =>
    dispatch(addItem({ ...category, type: 'category' }));
  const handleAddActiveIngredient = (activeIngredient: CategoryListItem) =>
    dispatch(addItem({ ...activeIngredient, type: 'activeIngredient' }));

  const sectionsConfig = {
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
      onSelect: (activeIngredient) =>
        handleAddActiveIngredient(activeIngredient),
    },
  };

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
