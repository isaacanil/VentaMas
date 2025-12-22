import React from 'react';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import { useCategoryState } from '../../../../../Context/CategoryContext';
import ROUTES_NAME from '@/router/routes/routesName';
import { Button } from '../../../system/Button/Button';

export const ProductCategoriesToolbar = ({ side = 'left' }) => {
  const { configureAddProductCategoryModal } = useCategoryState();

  const { CATEGORIES } = ROUTES_NAME.INVENTORY_TERM;

  const matchWithProductCategories = useMatch(CATEGORIES);

  return (
    matchWithProductCategories && (
      <Container>
        {side === 'right' && (
          <Group>
            <Button
              title="Categoría"
              startIcon={icons.operationModes.add}
              onClick={configureAddProductCategoryModal}
            />
          </Group>
        )}
      </Container>
    )
  );
};
const Container = styled.div``;
const Group = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
`;
