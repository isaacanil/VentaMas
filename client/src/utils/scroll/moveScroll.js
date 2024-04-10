import { useScreenSize } from "../../hooks/useScreenSize";

export const useMoveScroll = (ref) => {
    const { width } = useScreenSize(ref)

    const toStart = () => {
        if (ref.current && ref.current.scrollLeft > 0) {
            ref.current.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth',
            });
        }
    };

    const toEnd = () => {
        if (ref.current && ref.current.scrollLeft < ref.current.scrollWidth - ref.current.clientWidth) {
            ref.current.scrollTo({
                top: 0,
                left: ref.current.scrollWidth,
                behavior: 'smooth',
            });
        }
    };

    const toRight = () => {
        const distance = width / 3;
        if (ref.current) {
            ref.current.scrollBy({
                top: 0,
                left: distance,
                behavior: 'smooth'
            });
        }
    };

    const toLeft = () => {
        const distance = width / 3;
        if (ref.current) {
            ref.current.scrollBy({
                top: 0,
                left: -distance,
                behavior: 'smooth'
            });
        }
    };

    return {
        toStart,
        toEnd,
        toRight,
        toLeft
    };
}