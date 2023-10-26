export const truncateString = (str, num) => {
    if (!str) {  // Verifica si str es undefined o null
        return '';
    }
    if (str.length <= num) {
        return str;
    }
    return `${str.slice(0, num)}...`;
};