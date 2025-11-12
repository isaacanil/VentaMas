import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '../../../constants/icons/icons';
import { useCategoryState } from '../../../Context/CategoryContext';
import { SelectCategoryList } from '../../../features/category/categorySlicer';
import { useFbGetCategories } from '../../../firebase/categories/useFbGetCategories';
import { useScreenSize } from '../../../hooks/useScreenSize';

import { Category } from './Category';

export const Carrusel = ({ themeColor, addCategoryBtn = false }) => {
  const categoriesRef = useRef(null);
  const { width } = useScreenSize(categoriesRef);
  const { categories } = useFbGetCategories();
  const categorySelected = useSelector(SelectCategoryList);

  const MoveScroll = (direction) => {
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
      const distance = width / 3;
      categoriesRef.current.scrollBy({
        top: 0,
        left: distance,
        behavior: 'smooth',
      });
    };

    const toLeft = () => {
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
  const findElementInArray = (array, element) =>
    array.some((category) => category === element);
  return (
    <>
      <Container themeColor={themeColor}>
        <Button
          onClick={() => MoveScroll('left')}
          onDoubleClick={() => MoveScroll('start')}
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
          onClick={() => MoveScroll('right')}
          onDoubleClick={() => MoveScroll('end')}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </Button>
      </Container>
    </>
  );
};
const Container = styled.div`
  background-color: ${(props) => props.theme.bg.shade};
  width: 100%;
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  align-items: center;
  height: 2.6em;
  padding: 0 1em;
  gap: 0.4em;
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
  height: 1.5em;
  width: 1em;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3em;
  border: 0;
  color: ${({ theme }) => theme.text.primary};
  background-color: transparent;
  border-radius: var(--border-radius-light);
  outline: 0;
  transition: 500ms background-color ease-in-out;
  :hover {
    background-color: rgba(0, 0, 0, 0.2);
  }
`;
const Categories = styled(motion.ul)`
  border-radius: var(--border-radius-light);
  overflow-x: hidden;
  overflow-x: scroll;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0;
  display: flex;
  flex-wrap: nowrap;
  gap: 0.6em;
  ::-webkit-scrollbar {
    display: none; /* Oculta la barra de scroll */
  }
`;
