export const getPizzaType = (
  term1: string,
  term2?: string,
  isComplete?: boolean,
): string => {
  if (isComplete) {
    return `pizza ${term1}`;
  }

  if (term2 && !isComplete) {
    return `pizza mitad de ${term1} con ${term2}`;
  }

  return `pizza de ${term1}`;
};
