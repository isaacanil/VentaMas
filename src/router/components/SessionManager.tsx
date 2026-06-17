import React from 'react';

import VentamaxLoader from '@/components/ui/loader/GenericLoader';

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
