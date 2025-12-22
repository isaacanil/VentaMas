import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { NavigationContext } from './context';

export const NavigationProvider = ({ children }) => {
  const location = useLocation();
  const [pathHistory, setPathHistory] = useState([location.pathname]);

  // Actualizar historial cuando cambia la ruta (patrón render-update)
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setPathHistory((prev) => {
      // Evitar duplicados consecutivos (aunque prevPath ya maneja el cambio de ruta, doble chequeo es seguro)
      if (prev.length === 0 || prev[prev.length - 1] !== location.pathname) {
        return [...prev, location.pathname].slice(-10);
      }
      return prev;
    });
  }

  const getPreviousPath = (currentPath) => {
    const currentIndex = pathHistory.lastIndexOf(currentPath);
    if (currentIndex > 0) {
      return pathHistory[currentIndex - 1];
    }
    return null;
  };

  const value = {
    pathHistory,
    getPreviousPath,
    currentPath: location.pathname,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
