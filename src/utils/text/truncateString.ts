export const truncateString = (str: string | null | undefined, num: number) => {
  if (!str) {
    // Verifica si str es undefined o null
    return '';
  }
  if (str.length <= num) {
    return str;
  }
  return `${str.slice(0, num)}...`;
};
