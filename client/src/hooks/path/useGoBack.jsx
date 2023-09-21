import { useNavigate, useLocation } from 'react-router-dom';

export function useGoBack(defaultRoute = "/") {
  const navigate = useNavigate();
  const location = useLocation();

    

  const goBackOrToDefault = () => {
 
    console.log(location.key, 'location.key')
    if (location.key !== 'default') { // Verificar si hay un historial previo
      navigate(-1);
    } else {
      navigate(defaultRoute); // Navega a la ruta predeterminada si no hay historial
    }
  }

  return goBackOrToDefault;
}


