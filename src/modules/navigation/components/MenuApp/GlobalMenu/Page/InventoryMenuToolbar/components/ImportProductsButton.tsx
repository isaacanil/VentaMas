import { faFileImport } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { Button } from '@/components/ui/Button/Button';

export const ImportProductsButton = () => {
  return (
    <Button
      title="Importar"
      startIcon={<FontAwesomeIcon icon={faFileImport} />}
    />
  );
};
