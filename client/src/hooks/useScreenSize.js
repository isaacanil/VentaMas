import { useCallback, useEffect, useState } from "react"

export const useScreenSize = (widthRef) => {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

    // Función para obtener el ancho del elemento referenciado
    const getElementWidth = useCallback(() => {
        return widthRef.current ? widthRef.current.offsetWidth : 0;
    }, [widthRef]);

    useEffect(() => {
        if (!widthRef.current) return;

        // Actualizar el ancho del elemento referenciado
        setWidth(getElementWidth());

        const handleResize = () => {
            setWidth(getElementWidth())
        }
        let debounceTimeout;
        const handleResizeDebounced = () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(handleResize, 100);
        };

        window.addEventListener("resize", handleResizeDebounced);

        return () => {
            window.removeEventListener("resize", handleResizeDebounced);
        }
    }, [widthRef])

    return {
        width
    }
}