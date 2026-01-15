/**
 * Minimal debounce implementation to replace lodash.debounce
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const debounced = (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
    debounced.cancel = () => {
        if (timeout) clearTimeout(timeout);
    };
    return debounced;
};

/**
 * Minimal deep equal implementation to replace lodash.isEqual
 */
export const isEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (
        typeof a !== 'object' ||
        a === null ||
        typeof b !== 'object' ||
        b === null
    )
        return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key) || !isEqual(a[key], b[key])) return false;
    }

    return true;
};
