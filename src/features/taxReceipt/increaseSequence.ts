// LEGACY UI/PREVIEW ONLY.
// No usar este helper para reservar o confirmar secuencias fiscales reales.
export const increaseSequence = (sequence, increase, maxCharacters = 10) => {
  const numericResult = Number(sequence) + Number(increase);
  let result = numericResult.toString();
  result = result.slice(-maxCharacters);
  result = result.substring(0, maxCharacters);
  result = result.padStart(maxCharacters, '0');
  return result;
};
