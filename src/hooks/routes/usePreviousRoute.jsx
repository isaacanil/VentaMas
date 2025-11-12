import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook personalizado para obtener la ruta (pathname) anterior.
 * @returns {string | null} El pathname de la ruta anterior, o null si es la primera ruta.
 */
function usePreviousRoute() {
  const location = useLocation();
  const currentPathname = location.pathname;

  const previousPathnameRef = useRef(null);

  useEffect(() => {
    previousPathnameRef.current = currentPathname;
  }, [currentPathname]);

  return previousPathnameRef.current;
}

export default usePreviousRoute;
