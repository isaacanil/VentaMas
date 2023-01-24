export const useDecimalLimiter = (initialValue) => {
    const value = Number(initialValue).toFixed(2);
  return value ;
}

