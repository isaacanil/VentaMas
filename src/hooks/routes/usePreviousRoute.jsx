import { useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook personalizado para obtener la ruta (pathname) anterior.
 * @returns {string | null} El pathname de la ruta anterior, o null si es la primera ruta.
 */
function usePreviousRoute() {
  const location = useLocation();
  const currentPathname = location.pathname;

  const [state, setState] = useState({
    current: currentPathname,
    previous: null,
  });

  if (state.current !== currentPathname) {
    setState({
      current: currentPathname,
      previous: state.current,
    });
  }

  return state.previous;
}

export default usePreviousRoute;
