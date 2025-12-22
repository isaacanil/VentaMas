import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook personalizado para obtener un historial de navegación y la ruta anterior
 * filtrando opcionalmente por una clave en el pathname.
 *
 * @param {object} options Opciones de configuración.
 * @param {number} [options.maxLength=10] Longitud máxima del historial a mantener.
 * @param {string | null} [options.skipKey=null] Una cadena de texto. Si se encuentra en el pathname de una ruta del historial,
 *                                            se ignorará al buscar la ruta "anterior relevante".
 * @returns {{ history: Location[], previousRelevantRoute: Location | null }}
 *          Un objeto con el historial completo (array de objetos Location) y
 *          la última ruta visitada que no coincide con skipKey (o null).
 */
function useNavigationHistory(options = {}) {
  const { maxLength = 10, skipKey = null } = options;
  const location = useLocation();

  const [previousLocation, setPreviousLocation] = useState(location);
  const [history, setHistory] = useState([location]); // Empezar con la ubicación inicial

  const previousRelevantRoute = useMemo(() => {
    if (history.length < 2) return null;

    for (let i = history.length - 2; i >= 0; i--) {
      const routeToCheck = history[i];
      if (!skipKey || !routeToCheck.pathname.includes(skipKey)) {
        return routeToCheck;
      }
    }

    return null;
  }, [history, skipKey]);

  // Actualizar historial durante el render si la ubicación ha cambiado
  if (
    location.key !== previousLocation.key ||
    location.pathname !== previousLocation.pathname
  ) {
    setHistory((prevHistory) => {
      const newHistory = [...prevHistory, location];
      if (maxLength && newHistory.length > maxLength) {
        return newHistory.slice(newHistory.length - maxLength);
      }
      return newHistory;
    });
    setPreviousLocation(location);
  }

  return { history, previousRelevantRoute };
}

export default useNavigationHistory;
