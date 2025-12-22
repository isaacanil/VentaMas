import { useState, useEffect } from 'react';

export function useViewportWidth() {
  // Establecer el ancho inicial del viewport.
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Función para manejar el cambio de tamaño y actualizar el estado.
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    // Añadir el escuchador de eventos para detectar cambios de tamaño.
    window.addEventListener('resize', handleResize);

    // Limpieza: eliminar el escuchador de eventos cuando ya no sea necesario.
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Dependencia vacía, por lo que el efecto solo se ejecuta una vez (al montar y desmontar).

  return width; // Devolver el ancho actual del viewport.
}

export default useViewportWidth;
