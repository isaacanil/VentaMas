import React, { useRef } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'
import styled from 'styled-components'
import { useDispatch } from 'react-redux'
import { icons } from '../../../../../constants/icons/icons'
import { deleteCategorySelected } from '../../../../../features/category/categorySlicer'
import { useMoveScroll } from '../../../../../utils/scroll/moveScroll'
import * as antd from 'antd'
const { Button } = antd
export const CategoryBar = ({open, setOpen, categoriesSelected }) => {
  const categoriesRef = useRef(null)
  const { toEnd, toLeft, toRight, toStart } = useMoveScroll(categoriesRef)

  if (categoriesSelected.length === 0) {
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
          categoriesSelected.map((category) => (
            <Category key={category.id} category={category} />
          ))
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

}
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

// const Button = styled.button`
//     height: 1.5em;
//     width: 1em;
//     padding: 0;
//     margin: 0;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 1em;
//     border: 0;
//     color: ${({ theme }) => theme.text.primary};
//     background-color: transparent;
//     border-radius: var(--border-radius-light);
//     outline: 0;
//     transition: 500ms background-color ease-in-out;
//     :hover{
//         background-color: rgba(0, 0, 0, 0.200);
//     }
// `
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
    background-color: var(--color2);
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