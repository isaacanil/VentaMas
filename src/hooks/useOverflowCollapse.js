import { useState, useLayoutEffect, useRef, useCallback } from 'react';

/**
 * Hook para colapsar elementos cuando no caben en el contenedor.
 * Recoge refs y, cuando se produce un resize, calcula
 * cuántos hijos caben en el contenedor.
 *
 * @param {Object} options - Opciones de configuración
 * @param {number} options.moreButtonWidth - Ancho estimado del botón "Más" en píxeles
 * @param {number} options.gap - Espacio entre elementos en píxeles
 * @returns {Object} - containerRef, register function, visibleCount
 */
export const useOverflowCollapse = ({
  moreButtonWidth = 48,
  gap = 16,
} = {}) => {
  const containerRef = useRef(null);
  const itemRefs = useRef([]); // refs individuales
  const [visibleCount, setVisibleCount] = useState(Infinity);

  // Registrar refs de cada item
  const register = useCallback(
    (index) => (node) => {
      if (node) {
        itemRefs.current[index] = node;
      }
    },
    [],
  );

  // Recalcular en cada resize
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const calculateVisibleItems = () => {
      const containerWidth = containerRef.current.offsetWidth;
      const items = itemRefs.current.filter(Boolean);

      if (items.length === 0) {
        setVisibleCount(Infinity);
        return;
      }

      // Reservar espacio para el botón "Más" desde el principio
      let accumulatedWidth = moreButtonWidth + gap;
      let visibleItems = 0;

      for (let i = 0; i < items.length; i++) {
        const itemWidth = items[i]?.offsetWidth ?? 0;
        const widthWithGap = itemWidth + (i > 0 ? gap : 0);

        // Si es el último elemento, no necesitamos el botón "Más"
        const isLastItem = i === items.length - 1;
        const requiredWidth =
          accumulatedWidth +
          widthWithGap -
          (isLastItem ? moreButtonWidth + gap : 0);

        if (requiredWidth <= containerWidth) {
          accumulatedWidth += widthWithGap;
          visibleItems++;
        } else {
          break;
        }
      }

      // Si todos los elementos caben, no necesitamos el botón "Más"
      if (visibleItems === items.length) {
        setVisibleCount(Infinity);
      } else {
        setVisibleCount(visibleItems);
      }
    };

    // Calcular al montar
    calculateVisibleItems();

    // Observar cambios de tamaño
    const resizeObserver = new ResizeObserver(calculateVisibleItems);
    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [moreButtonWidth, gap]);

  // Limpiar refs cuando el componente se desmonte
  useLayoutEffect(() => {
    return () => {
      itemRefs.current = [];
    };
  }, []);

  return {
    containerRef,
    register,
    visibleCount,
    hasOverflow:
      visibleCount !== Infinity &&
      visibleCount < itemRefs.current.filter(Boolean).length,
  };
};
