import React from 'react';
import { useMatches } from 'react-router-dom';
import { getRouteMetaFromHandle } from '@/router/routes/routeHandle';

const SEO = () => {
  const matches = useMatches();
  const fallbackRoute = {
    title: 'Aplicación - Plataforma de Gestión',
    metaDescription:
      'Una plataforma avanzada para gestionar tus procesos empresariales.',
  };
  let title = fallbackRoute.title;
  let metaDescription = fallbackRoute.metaDescription;
  let hasRouteTitle = false;
  let hasRouteMetaDescription = false;

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const routeMeta = getRouteMetaFromHandle(matches[index]?.handle);
    if (!routeMeta) continue;

    if (!hasRouteTitle && typeof routeMeta.title === 'string' && routeMeta.title) {
      title = routeMeta.title;
      hasRouteTitle = true;
    }
    if (
      !hasRouteMetaDescription &&
      typeof routeMeta.metaDescription === 'string' &&
      routeMeta.metaDescription
    ) {
      metaDescription = routeMeta.metaDescription;
      hasRouteMetaDescription = true;
    }

    if (hasRouteTitle && hasRouteMetaDescription) break;
  }

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
    </>
  );
};

export default SEO;
