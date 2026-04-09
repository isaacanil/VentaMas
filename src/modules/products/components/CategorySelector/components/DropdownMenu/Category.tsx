import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import styled from 'styled-components';

interface DropdownCategoryItem {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

interface DropdownCategoryProps {
  item?: DropdownCategoryItem;
  isFavorite?: boolean;
  searchTerm?: string;
  color?: string;
  selected?: boolean;
  onClick?: (item: DropdownCategoryItem) => void;
  toggleFavorite?: (item: DropdownCategoryItem) => void;
}

const EMPTY_DROPDOWN_CATEGORY_ITEM: DropdownCategoryItem = {};

export const Category = ({
  item = EMPTY_DROPDOWN_CATEGORY_ITEM,
  isFavorite = false,
  searchTerm = '',
  color = '#f2f2f2',
  selected = false,
  onClick,
  toggleFavorite,
}: DropdownCategoryProps) => {
  const [isHoverFavorite, setIsHoverFavorite] = useState(false);

  const highlightMatch = (text: string) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index}>{part}</mark>
      ) : (
        part
      ),
    );
  };

  const name = typeof item?.name === 'string' ? item.name : '';

  return (
    <Container
      selected={selected}
      color={color}
      onClick={() => onClick?.(item)}
    >
      <CategoryItem>{highlightMatch(name)}</CategoryItem>
      {toggleFavorite && (
        <FavoriteStar
          onMouseEnter={() => setIsHoverFavorite(true)}
          onMouseLeave={() => setIsHoverFavorite(false)}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item);
          }}
        >
          <FontAwesomeIcon
            icon={isFavorite || isHoverFavorite ? faStar : faStarRegular}
          />
        </FavoriteStar>
      )}
    </Container>
  );
};
const Container = styled.div<{ selected?: boolean; color: string }>`
  display: grid;
  grid-template-columns: 1fr min-content min-content;
  justify-content: space-between;
  padding: 0 0.4em;
  border-radius: 0.4em;
  cursor: pointer;
  border: 2px solid transparent;
  background-color: ${({ color }) => color}; /* Usamos el color dinámico */
  &:hover {
    background-color: ${({ color }) =>
      color}; /* Mantén el hover del mismo color */
  }
  ${(props) =>
    props.selected &&
    `
        border: 2px solid var(--color1);
        background-color: var(--color2);
    `}
`;
const CategoryItem = styled.span`
  padding: 0.4em;
  height: 100%;
`;
const FavoriteStar = styled.span`
  /* estilos para la estrella favorita */
  height: 100%;
  display: flex;
  align-items: center;
  margin-left: 10px;
  cursor: pointer;

  svg {
    color: #ffd900;
    font-size: 1.2em;
  }
`;
