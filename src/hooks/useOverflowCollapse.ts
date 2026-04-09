import { useState, useLayoutEffect, useRef, useCallback } from 'react';

type OverflowCollapseOptions = {
  gap?: number;
  endPadding?: number;
};

/**
 * Hook para colapsar elementos cuando no caben en el contenedor.
 * Recoge refs y, cuando se produce un resize, calcula
 * cuántos hijos caben en el contenedor.
 *
 * @param {Object} options - Opciones de configuración
 * @param {number} options.gap - Espacio entre elementos en píxeles
 * @returns {Object} - containerRef, register function, visibleCount
 */
export const useOverflowCollapse = ({
  gap = 16,
  endPadding = 0,
}: OverflowCollapseOptions = {}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [visibleCount, setVisibleCount] = useState<number>(Infinity);
  const [itemCount, setItemCount] = useState(0);

  // Registrar refs de cada item
  const register = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      itemRefs.current[index] = node;
      setItemCount(itemRefs.current.filter(Boolean).length);
    },
    [],
  );

  // Recalcular en cada resize
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const calculateVisibleItems = () => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const availableWidth = Math.max(0, containerWidth - endPadding);
      const items = itemRefs.current.filter(Boolean);

      if (availableWidth <= 0 || items.length === 0) {
        setVisibleCount(Infinity);
        return;
      }

      const parentElement = items[0]?.parentElement;
      const computedGap = parentElement
        ? Number.parseFloat(getComputedStyle(parentElement).columnGap || '')
        : Number.NaN;
      const resolvedGap = Number.isFinite(computedGap) ? computedGap : gap;

      let accumulatedWidth = 0;
      let visibleItems = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) continue;

        const style = getComputedStyle(item);
        const marginLeft = Number.parseFloat(style.marginLeft || '0') || 0;
        const marginRight = Number.parseFloat(style.marginRight || '0') || 0;
        const itemWidth = item.offsetWidth + marginLeft + marginRight;
        const requiredWidth =
          accumulatedWidth +
          (i > 0 ? resolvedGap : 0) +
          itemWidth;

        if (requiredWidth <= availableWidth) {
          accumulatedWidth = requiredWidth;
          visibleItems++;
        } else {
          break;
        }
      }

      if (visibleItems === items.length) {
        setVisibleCount(Infinity);
      } else {
        setVisibleCount(visibleItems);
      }
    };

    calculateVisibleItems();

    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleItems();
    });
    resizeObserver.observe(containerRef.current);
    itemRefs.current.forEach((item) => {
      if (item) {
        resizeObserver.observe(item);
      }
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [endPadding, gap, itemCount]);

  useLayoutEffect(() => {
    return () => {
      itemRefs.current = [];
    };
  }, []);

  return {
    containerRef,
    register,
    visibleCount,
    hasOverflow: visibleCount !== Infinity && visibleCount < itemCount,
  };
};
