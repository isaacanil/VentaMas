import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { routes } from "../routes/routes";

const SEO = () => {
  const location = useLocation();

  // Buscar la ruta activa
  const currentRoute = routes.find((route) => route.path === location.pathname) || {
    title: "Aplicación - Plataforma de Gestión",
    metaDescription: "Una plataforma avanzada para gestionar tus procesos empresariales.",
  };

  return (
    <Helmet>
      <title>{currentRoute.title}</title>
      <meta name="description" content={currentRoute.metaDescription} />
    </Helmet>
  );
};

export default SEO;
