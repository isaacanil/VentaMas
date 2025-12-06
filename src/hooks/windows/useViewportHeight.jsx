import { useState, useEffect } from 'react';

export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight;
    }
    return 0;
  });

  useEffect(() => {
    const updateHeight = () => {
      // Usar la altura real del viewport
      const height = window.innerHeight;
      setViewportHeight(height);

      // También actualizar la variable CSS custom
      document.documentElement.style.setProperty(
        '--viewport-height',
        `${height}px`,
      );
    };

    // Actualizar inmediatamente
    updateHeight();

    // Escuchar cambios en el viewport
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    // Para iOS Safari que cambia la altura cuando se oculta/muestra la barra
    window.addEventListener('scroll', updateHeight, { passive: true });

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      window.removeEventListener('scroll', updateHeight);
    };
  }, []);

  return viewportHeight;
};
