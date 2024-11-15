import React, { useRef, forwardRef } from 'react'
import styled from 'styled-components'
import { useDispatch } from 'react-redux'
import { icons } from '../../../../../constants/icons/icons'
import { deleteItem } from '../../../../../features/category/categorySlicer'
import { useMoveScroll } from '../../../../../utils/scroll/moveScroll'
import { Button } from 'antd';
import { categoryColors } from '../../categoryColors'

export const CategoryBar = forwardRef(({ open, setOpen, items = [] }, ref) => {
  const categoriesRef = useRef(null)
  const { toEnd, toLeft, toRight, toStart } = useMoveScroll(categoriesRef)

  if (items?.length === 0) {
    return (
      <Container>
        <Button

          icon={icons.editingActions.create}
          onClick={() => setOpen(!open)}
        >
          Seleccionar categoría
        </Button>
      </Container>
    )
  }

  return (
    <Container>
      <Button
        icon={icons.editingActions.create}
        onClick={() => setOpen(!open)}
      >
      </Button>
      <Button
        icon={icons.arrows.chevronLeft}
        onClick={toLeft}
        onDoubleClick={toStart}
      >
      </Button>
      <CategoryList
        ref={categoriesRef}
      >
        {
          (items?.length === 0) ?
            (<>No elementos</>) :
            (items.map((item) => (
              <Category key={item.id} item={item} />
            )))
        }
      </CategoryList>
      <Button
        onClick={toRight}
        onDoubleClick={toEnd}
        icon={icons.arrows.chevronRight}
      >
      </Button>
    </Container >
  )
})
const Container = styled.div`
  height: 2.6em;
  align-items: center;
  padding: 0.2em 0.4em;
  width: 100%;
  gap: 0.4em;
  display: grid;
  grid-template-columns: min-content min-content 1fr min-content;
  background-color: #ffffff;

`;
const Category = ({ item }) => {
  const dispatch = useDispatch();
  const handleDeleteCategory = () => {
    dispatch(deleteItem(item))
  };
  return (
    <CategoryItem type={item.type}>
      {item.name}
      <RemoveIcon onClick={handleDeleteCategory} >{icons.editingActions.cancel}</RemoveIcon>
    </CategoryItem>
  );
}

const CategoryList = styled.div`
  /* estilos para la lista de categorías */ 
  display: flex;
  gap: 0.4em;
  align-items: center;
  height: 100%;
  overflow-x: auto;
  border-radius: 0.4em;
  white-space: nowrap;
  ::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryItem = styled.div`
    /* estilos para cada categoría */
    padding: 0 0.6em ;
    height: 2.2em;
    display: flex;
    gap: 1em;
    white-space: nowrap;
    align-items: center;
    background-color: ${({type}) => categoryColors[type] || categoryColors.default};
    border-radius: 0.4em;
    justify-content: space-between;
`;

const RemoveIcon = styled.span`
  /* estilos para el icono de eliminar */
  cursor: pointer;
  color: var(--Black5);
  font-size: 1em;
  height: 1.2em;
  width: 1.2em;
  display: flex;
  align-items: center;
  justify-content: center;
  :hover{
    color: var(--Black5);
    background-color: var(--White5);
    border-radius: 0.4em;
  }

`;