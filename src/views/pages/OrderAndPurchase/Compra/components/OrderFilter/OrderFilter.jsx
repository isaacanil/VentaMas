import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import styled from 'styled-components';

import { Button } from '@/views/templates/system/Button/Button';

import { OrderMenuFilter } from './OrderMenuFilter/OrderMenuFilter';

export const OrderFilter = () => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  const handleOpenMenu = () => setMenuIsOpen(!menuIsOpen);

  return (
    <Container>
      <Button
        borderRadius="normal"
        startIcon={<FontAwesomeIcon icon={faFilter} />}
        title="Filtros"
        color="gray-dark"
        onClick={handleOpenMenu}
      />
      <OrderMenuFilter MenuIsOpen={menuIsOpen} />
    </Container>
  );
};

const Container = styled.div``;
