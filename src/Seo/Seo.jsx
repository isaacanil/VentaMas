import React from 'react';
import { useLocation } from 'react-router-dom';

import { routes } from '@/router/routes/routes';

const SEO = () => {
  const location = useLocation();

  const currentRoute = routes.find(
    (route) => route.path === location.pathname,
  ) || {
    title: 'Aplicación - Plataforma de Gestión',
    metaDescription:
      'Una plataforma avanzada para gestionar tus procesos empresariales.',
  };

  return (
    <>
      <title>{currentRoute.title}</title>
      <meta name="description" content={currentRoute.metaDescription} />
    </>
  );
};

export default SEO;
