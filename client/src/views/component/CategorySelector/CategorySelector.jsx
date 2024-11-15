import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { DropdownMenu } from './components/DropdownMenu/DropdownMenu';
import { icons } from '../../../constants/icons/icons';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, deleteAllItems, SelectCategoryList, SelectCategoryState } from '../../../features/category/categorySlicer';
import { CategoryBar } from './components/CategoryBar/CategoryBar';
import { useClickOutSide } from '../../../hooks/useClickOutSide';
import { fbAddFavoriteProductCategory } from '../../../firebase/categories/fbAddFavoriteProductCategory';
import { fbRemoveFavoriteProductCategory } from '../../../firebase/categories/fbRemoveFavoriteProductCategory';
import { selectUser } from '../../../features/auth/userSlice';
import { filterFavoriteProductCategories } from '../../../utils/data/products/category'
import { useFbGetCategories } from '../../../firebase/categories/useFbGetCategories';
import { useGetFavoriteProductCategories } from '../../../firebase/categories/fbGetFavoriteProductCategories';
import { useListenActiveIngredients } from '../../../firebase/products/activeIngredient/activeIngredients';
import { fbToggleFavoriteProductCategory } from '../../../firebase/categories/fbToggleFavoriteProductCategory';

export const CategorySelector = ({ }) => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const { categories } = useFbGetCategories()
  const favoriteProductCategoryArray = useGetFavoriteProductCategories(user)
  const categoriesSelected = useSelector(SelectCategoryList)
  const favoriteCategories = filterFavoriteProductCategories(categories, favoriteProductCategoryArray.favoriteCategories)
  const { data: activeIngredients, loading } = useListenActiveIngredients()
  const { items } = useSelector(SelectCategoryState)
  const handleToggleCategoryFavorite = async (category) => {
    await fbToggleFavoriteProductCategory(user, category)
  }
  const handleDeleteFavorite = async (category) => {
    try {
      await fbRemoveFavoriteProductCategory(user, category.id)
    } catch (error) {
      console.error('Error al eliminar categoría de favoritos: ', error)
    }
  }
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  useClickOutSide(containerRef, open == true, () => setOpen(false));

  function transformCategoriesToItems(categories) {
    return categories.map(item => {
      const { name, id } = item.category;
      return {
        id: id,     // Usamos el id principal (puede ser el id de la categoría si prefieres)
        name: name,      // Usamos el nombre de la categoría
        isFavorite: false,  // Valor predeterminado, puedes ajustarlo si hay un indicador real
        selected: false     // Valor predeterminado para saber si está seleccionado
      };
    });
  }
  function markFavorites(categories, favoriteCategories) {
    return categories.map(category => {
      const isFavorite = favoriteCategories.some(fav => fav.id === category.id); // Verifica si es favorita
      return {
        ...category,
        isFavorite: isFavorite  // Actualiza el estado de favorito
      };
    });
  }
  function separateCategories(categories, favoriteCategories) {
    // Primero transformamos las categorías
    const transformedCategories = transformCategoriesToItems(categories);
    const transformedFavoriteCategories = transformCategoriesToItems(favoriteCategories);

    // Luego marcamos las favoritas
    const markedCategories = markFavorites(transformedCategories, transformedFavoriteCategories);

    // Separamos en favoritas y normales
    const favorites = [];
    const normals = [];

    markedCategories.forEach(category => {
      if (category.isFavorite) {
        favorites.push(category);
      } else {
        normals.push(category);
      }
    });

    return { favorites, normals }; // Retornamos ambas listas
  }
  function markSelectedItems(items, selectedItems) {
    return items.map(item => {
      const isSelected = selectedItems.some(selected => selected.id === item.id); // Verifica si ya está seleccionada
      return {
        ...item,
        selected: isSelected, // Marca como seleccionada si ya está en la lista de seleccionados
      };
    });
  }

  const { favorites, normals } = separateCategories(categories, favoriteCategories);
  // Luego, marcas las categorías normales y favoritas como seleccionadas
  const markedFavorites = markSelectedItems(favorites, categoriesSelected);
  const markedNormals = markSelectedItems(normals, categoriesSelected);

  // Luego, marcas los principios activos como seleccionados
  const markedActiveIngredients = markSelectedItems(activeIngredients, categoriesSelected);

  const handleDeleteAllItems = () => dispatch(deleteAllItems())
  const handleAddCategory = (category) => dispatch(addItem({ ...category, type: 'category' }))
  const handleAddActiveIngredient = (activeIngredient) => dispatch(addItem({ ...activeIngredient, type: 'activeIngredient' }))

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
      onSelect: (activeIngredient) => handleAddActiveIngredient(activeIngredient),
    }
  }

  return (
    <Container
      ref={containerRef}
    >
      <CategoryBar
        open={open}
        setOpen={setOpen}
        items={items}
      />
      {
        open && (
          <DropdownMenu
            ref={containerRef}
            setOpen={setOpen}
            sectionsConfig={sectionsConfig}
            deleteAllItems={handleDeleteAllItems}
          />
        )
      }
    </Container>
  );
};

const Container = styled.div`
    position: relative;
  /* estilos para el contenedor principal */
`;
