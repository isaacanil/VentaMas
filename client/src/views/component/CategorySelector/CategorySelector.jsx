import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { DropdownMenu } from './components/DropdownMenu/DropdownMenu';
import { icons } from '../../../constants/icons/icons';
import { useDispatch } from 'react-redux';
import { deleteCategorySelected } from '../../../features/category/categorySlicer';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { CategoryBar } from './components/CategoryBar/CategoryBar';
import { useClickOutSide } from '../../../hooks/useClickOutSide';

export const CategorySelector = ({
  favoriteCategories,
  categories,
  categoriesSelected,
  addFavoriteCategory,
  deleteFavoriteCategory,
  handleCategoryClick
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  useClickOutSide(containerRef, open == true, () => setOpen(false));
  return (
    <Container
    ref={containerRef}
     >
      <CategoryBar
        ref={containerRef}
        open={open}
        setOpen={setOpen}
        categoriesSelected={categoriesSelected}
      />
      {
        open && (
          <DropdownMenu
            ref={containerRef}
            categories={categories}
            setOpen={setOpen}
            categoriesSelected={categoriesSelected}
            favoriteCategories={favoriteCategories}
            handleCategoryClick={handleCategoryClick}
            addFavoriteCategory={addFavoriteCategory}
            deleteFavoriteCategory={deleteFavoriteCategory}
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

const RemoveIcon = styled.span`
  /* estilos para el icono de eliminar */
`;

const Category = ({ category }) => {
  const dispatch = useDispatch();
  const handleDeleteCategory = () => {
    dispatch(deleteCategorySelected(category))
  };
  return (
    <CategoryItem>
      {category.name}
      <RemoveIcon onClick={handleDeleteCategory} >{icons.editingActions.cancel}</RemoveIcon>
    </CategoryItem>
  );
}

const CategoryItem = styled.div`
    /* estilos para cada categoría */
    padding: 0.4em 0.8em;
    height: 100%;
    display: flex;
    gap: 1em;
    white-space: nowrap;
    align-items: center;
    justify-content: space-between;
    border-right: 1px solid #ccc;
    :last-child {
        border-right: none;
    }
`;