import { Button } from 'antd';
import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import { deleteItem } from '../../../../../features/category/categorySlicer';
import { useMoveScroll } from '../../../../../utils/scroll/moveScroll';
import { categoryColors } from '../../categoryColors';

export const CategoryBar = ({ open, setOpen, items = [] }) => {
  const categoriesRef = useRef(null);
  const { toEnd, toLeft, toRight, toStart } = useMoveScroll(categoriesRef);

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
    );
  }

  return (
    <Container>
      <Button
        icon={icons.editingActions.create}
        onClick={() => setOpen(!open)}
      />
      <Button
        icon={icons.arrows.chevronLeft}
        onClick={toLeft}
        onDoubleClick={toStart}
      />
      <CategoryList ref={categoriesRef}>
        {items?.length === 0 ? (
          <>No elementos</>
        ) : (
          items.map((item) => <Category key={item.id} item={item} />)
        )}
      </CategoryList>
      <Button
        onClick={toRight}
        onDoubleClick={toEnd}
        icon={icons.arrows.chevronRight}
      />
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-columns: min-content min-content 1fr min-content;
  gap: 0.4em;
  align-items: center;
  width: 100%;
  height: 2.6em;
  padding: 0.2em 0.4em;
  background-color: #fff;
`;
const Category = ({ item }) => {
  const dispatch = useDispatch();
  const handleDeleteCategory = () => {
    dispatch(deleteItem(item));
  };
  return (
    <CategoryItem type={item.type}>
      {item.name}
      <RemoveIcon onClick={handleDeleteCategory}>
        {icons.editingActions.cancel}
      </RemoveIcon>
    </CategoryItem>
  );
};

const CategoryList = styled.div`

  /* estilos para la lista de categorías */
  display: flex;
  gap: 0.4em;
  align-items: center;
  height: 100%;
  overflow-x: auto;
  white-space: nowrap;
  border-radius: 0.4em;

  ::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryItem = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: space-between;
  height: 2.2em;

  /* estilos para cada categoría */
  padding: 0 0.6em;
  white-space: nowrap;
  background-color: ${({ type }) =>
    categoryColors[type] || categoryColors.default};
  border-radius: 0.4em;
`;

const RemoveIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2em;
  height: 1.2em;
  font-size: 1em;
  color: var(--black-5);

  /* estilos para el icono de eliminar */
  cursor: pointer;

  &:hover {
    color: var(--black-5);
    background-color: var(--white-5);
    border-radius: 0.4em;
  }
`;
