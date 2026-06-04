import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

import { Button } from '@/components/ui/Button/Button';
import { OrderMenuFilter } from '@/modules/contacts/components/OrderMenuFilterShared/OrderMenuFilter';

export const OrderFilter = () => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const handleOpenMenu = () => setMenuIsOpen((prev) => !prev);

  return (
    <>
      <Button
        borderRadius="normal"
        startIcon={<FontAwesomeIcon icon={faFilter} />}
        title="Filtros"
        color="gray-dark"
        onClick={handleOpenMenu}
      />
      <OrderMenuFilter isOpen={menuIsOpen} />
    </>
  );
};
