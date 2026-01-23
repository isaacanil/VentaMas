import { motion } from 'framer-motion';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { addItem, deleteItem } from '@/features/category/categorySlicer';
import type { CategoryRecord } from '@/firebase/categories/types';
import getIconFromText from '@/utils/text/getIconFromText';

import type { ReactNode, RefObject } from 'react';

interface CategoryProps {
  category: CategoryRecord;
  ref?: RefObject<HTMLElement>;
  onClick?: () => void;
  type?: string;
  icon?: ReactNode;
  themeColor?: string | null;
  selected?: boolean;
  index?: number;
}

type CategoryItemPayload = {
  id: string;
  name: string;
  type: 'category' | 'activeIngredient';
};

type CategoryDeletePayload = {
  id: string;
  type: string;
};

export const Category = ({
  category,
  ref,
  onClick,
  type,
  icon,
  themeColor,
  selected,
  index,
}: CategoryProps) => {
  const [isSelected, setIsSelected] = useState(false);
  const dispatch = useDispatch();
  const start = (category: CategoryRecord, ref?: RefObject<HTMLElement>) => {
    if (isSelected === false) {
      setIsSelected(!isSelected);
      dispatch(addItem(category as CategoryItemPayload));
    }
    if (isSelected) {
      setIsSelected(!isSelected);
      dispatch(deleteItem(category as CategoryDeletePayload));
    }
    requestAnimationFrame(() => {
      if (ref?.current) {
        ref.current.scrollTo(0, 0);
      }
    });
  };
  return (
    <Container
      themeColor={themeColor}
      type={type}
      selected={selected ? true : false}
      onClick={() => (onClick ? onClick() : start(category, ref))}
      // variants={effectCategory}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ delay: (index ?? 0) * 0.4 }}
    >
      {icon && icon}
      {getIconFromText(category.name)}
      {category.name}
    </Container>
  );
};

const Container = styled(motion.li)<{
  type?: string;
  selected?: boolean;
  themeColor?: string | null;
}>`
  align-items: center;
  background-color: ${({ theme }) => theme.bg.color2};
  border-radius: var(--border-radius);
  color: #585858;
  display: flex;
  font-size: 14px;
  font-weight: 500;
  gap: 0.5em;
  height: 2.2em;
  letter-spacing: 0.2px;
  padding: 0 0.75em;
  text-transform: capitalize;
  transition: 300ms ease-in-out;
  white-space: nowrap;

  &:hover {
    color: rgb(83 83 83);
    background-color: #e7f0fa;
  }

  ${(props) => {
    switch (props.type) {
      case 'create':
        return `
                    background-color: var(--color-success-light);
                    color: var(--color-success-dark);
                    ${
                      !props.selected &&
                      `
                        &:hover{
                        background-color: var(--color-success-light);
                        color: var(--color-success-dark);
                    }`
                    }
                    
                    `;
      default:
        break;
    }
  }}

  ${(props) => {
    switch (props.selected) {
      case true:
        return `
                    background-color: ${props.theme.bg.color4};
                    color: white;
                    &:hover{
                        background-color: ${props.theme.bg.color4};
                        color: white;
                    }
                   
                `;

      default:
        break;
    }
  }}
`;
