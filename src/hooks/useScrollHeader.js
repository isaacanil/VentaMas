import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para crear headers dinámicos que responden al scroll
 * @param {Object} options - Configuración del hook
 * @param {number} options.threshold - Umbral de scroll para activar el estado compacto (default: 50)
 * @param {number} options.debounceDelay - Delay para el debounce del scroll (default: 10)
 * @returns {Object} - Estado del header y referencia del contenedor de scroll
 */
const useScrollHeader = (options = {}) => {
  const {
    threshold = 50,
    debounceDelay = 10
  } = options;

  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const scrollContainerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce para optimizar performance
      timeoutRef.current = setTimeout(() => {
        const currentScrollY = scrollContainer.scrollTop;
        setScrollY(currentScrollY);
        setIsScrolled(currentScrollY > threshold);
      }, debounceDelay);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [threshold, debounceDelay]);

  return {
    isScrolled,
    scrollY,
    scrollContainerRef,
    progress: Math.min(scrollY / threshold, 1) // Progreso de 0 a 1 para animaciones suaves
  };
};

export default useScrollHeader;
