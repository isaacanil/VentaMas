import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useRef } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { useCategoryState } from '@/Context/CategoryContext/useCategoryState';
import { SelectCategoryList } from '@/features/category/categorySlicer';
import { useFbGetCategories } from '@/firebase/categories/useFbGetCategories';
import type { CategoryDocument } from '@/firebase/categories/types';
import { useElementSize } from '@/hooks/useElementSize';

import { Category } from './Category';

interface CarruselProps {
  themeColor?: string | null;
  addCategoryBtn?: boolean;
}

type ScrollDirection = 'start' | 'end' | 'left' | 'right';

export const Carrusel = ({
  themeColor,
  addCategoryBtn = false,
}: CarruselProps) => {
  const categoriesRef = useRef<HTMLUListElement | null>(null);
  const { width } = useElementSize(categoriesRef);
  const { categories } = useFbGetCategories() as {
    categories: CategoryDocument[];
  };
  const categorySelected = useSelector(SelectCategoryList) as unknown[];

  const handleMoveScroll = (direction: ScrollDirection) => {
    const cacheScrollMeasurements = () => {
      const element = categoriesRef.current;
      if (!element) return null;

      return {
        scrollLeft: element.scrollLeft,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      };
    };

    const toStart = () => {
      const measurements = cacheScrollMeasurements();
      if (measurements && measurements.scrollLeft > 0) {
        categoriesRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });
      }
    };

    const toEnd = () => {
      const measurements = cacheScrollMeasurements();
      if (
        measurements &&
        measurements.scrollLeft <
          measurements.scrollWidth - measurements.clientWidth
      ) {
        categoriesRef.current.scrollTo({
          top: 0,
          left: measurements.scrollWidth,
          behavior: 'smooth',
        });
      }
    };

    const toRight = () => {
      if (!categoriesRef.current) return;
      const distance = width / 3;
      categoriesRef.current.scrollBy({
        top: 0,
        left: distance,
        behavior: 'smooth',
      });
    };

    const toLeft = () => {
      if (!categoriesRef.current) return;
      const distance = width / 3;
      categoriesRef.current.scrollBy({
        top: 0,
        left: -distance,
        behavior: 'smooth',
      });
    };
    if (direction === 'start') {
      toStart();
    }
    if (direction === 'end') {
      toEnd();
    }
    if (direction === 'right') {
      toRight();
    }
    if (direction === 'left') {
      toLeft();
    }
  };

  const { configureAddProductCategoryModal } = useCategoryState();
  const findElementInArray = (array: unknown[], element: unknown) =>
    array.some((category) => category === element);
  return (
    <LazyMotion features={domAnimation}>
      <Container themeColor={themeColor}>
        <Button
          onClick={() => handleMoveScroll('left')}
          onDoubleClick={() => handleMoveScroll('start')}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </Button>

        <Categories ref={categoriesRef}>
          {addCategoryBtn ? (
            <Category
              category={{ name: 'Categoría' }}
              onClick={configureAddProductCategoryModal}
              type="create"
              icon={icons.operationModes.add}
            />
          ) : null}

          {categories.length > 0
            ? categories.map(({ category }, index) => (
                <Category
                  themeColor={themeColor ? themeColor : null}
                  category={category}
                  selected={findElementInArray(categorySelected, category.name)}
                  key={category.name}
                  index={index}
                />
              ))
            : null}
        </Categories>
        <Button
          onClick={() => handleMoveScroll('right')}
          onDoubleClick={() => handleMoveScroll('end')}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </Button>
      </Container>
    </LazyMotion>
  );
};
const Container = styled.div`
  align-items: center;
  background-color: ${(props) => props.theme.bg.shade};
  display: grid;
  gap: 0.4em;
  grid-template-columns: min-content 1fr min-content;
  height: 2.6em;
  padding: 0 1em;
  width: 100%;
  ${(props) => {
    switch (props.themeColor) {
      case 'transparent':
        return `
                    background-color: var(--color2);
                `;
    }
  }}
`;
const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1.5em;
  padding: 0;
  margin: 0;
  font-size: 1.3em;
  color: ${({ theme }) => theme.text.primary};
  outline: 0;
  background-color: transparent;
  border: 0;
  border-radius: var(--border-radius-light);
  transition: 500ms background-color ease-in-out;

  &:hover {
    background-color: rgb(0 0 0 / 20%);
  }
`;
const Categories = styled(m.ul)`
  display: flex;
  flex-wrap: nowrap;
  gap: 0.6em;
  padding: 0;
  overflow-x: hidden;
  overflow-x: scroll;
  scrollbar-width: none;
  border-radius: var(--border-radius-light);
  -webkit-overflow-scrolling: touch;

  ::-webkit-scrollbar {
    display: none; /* Oculta la barra de scroll */
  }
`;
