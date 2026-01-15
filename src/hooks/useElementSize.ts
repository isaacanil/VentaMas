import { useLayoutEffect, useState, type RefObject } from 'react';

interface ElementSize {
    width: number;
    height: number;
}

export const useElementSize = (ref: RefObject<HTMLElement>): ElementSize => {
    const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const target = ref.current;
        if (!target) return;

        // Inicializar el tamaño actual
        const setInitialSize = () => {
            const rect = target.getBoundingClientRect();
            setSize({
                width: rect.width,
                height: rect.height,
            });
        };

        setInitialSize();

        // Observar cambios reales en el elemento
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        observer.observe(target);

        return () => observer.disconnect();
    }, [ref]);

    return size;
};
