import React from 'react';

import { GenericLoader as VentamaxLoader } from '@/components/ui/loader';

export const SessionManager = ({ status, error }) => {
  const show = status === 'checking' || status === 'error';

  return (
    <VentamaxLoader
      variant="system"
      show={show}
      status={status}
      error={error}
      message="Cargando sesión..."
    />
  );
};
