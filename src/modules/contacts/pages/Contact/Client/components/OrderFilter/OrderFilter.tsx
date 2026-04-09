import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import styled from 'styled-components';

import { Button } from '@/components/ui/Button/Button';

import { OrderMenuFilter } from './OrderMenuFilter/OrderMenuFilter';

export const OrderFilter = () => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const handleOpenMenu = () => setMenuIsOpen((prev) => !prev);
  return (
    <Container>
      {' '}
      <Button
        borderRadius="normal"
        startIcon={<FontAwesomeIcon icon={faFilter} />}
        title={`Filtros`}
        color="gray-dark"
        onClick={handleOpenMenu}
      />
      <OrderMenuFilter MenuIsOpen={menuIsOpen} />
    </Container>
  );
};
const Container = styled.div``;
