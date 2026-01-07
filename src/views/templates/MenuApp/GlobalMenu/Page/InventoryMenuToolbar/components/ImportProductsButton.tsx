// @ts-nocheck
import { faFileImport } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { Button } from '@/views/templates/system/Button/Button';

export const ImportProductsButton = () => {
  return (
    <Button
      title="Importar"
      startIcon={<FontAwesomeIcon icon={faFileImport} />}
    />
  );
};
