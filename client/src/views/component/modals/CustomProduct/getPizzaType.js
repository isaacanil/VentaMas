export const getPizzaType = (term1, term2, isComplete) => {
    const regex = /Completa/;
    const isTerm1Complete = term1.match(regex) !== null;
    
    if (isComplete) {
      return `pizza ${term1}`;
    }
    
    if (term2 && !isComplete) {
      return `pizza mitad de ${term1} con ${term2}`;
    }
    
    return `pizza de ${term1}`;
  };

