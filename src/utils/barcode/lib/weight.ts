// @ts-nocheck
// Detecta si un código es variable (peso/precio)
export function isVariableWeightCode(code) {
  if (!code || code.length < 3) return false;
  const prefix = code.slice(0, 2);
  return prefix >= '20' && prefix <= '29';
}

// Analiza un código de peso variable
export function analyzeVariableWeightCode(code) {
  if (!isVariableWeightCode(code) || code.length !== 13) return null;
  return {
    type: 'Peso/Precio Variable',
    prefix: code.slice(0, 2),
    itemCode: code.slice(2, 7),
    variableData: code.slice(7, 12),
    checkDigit: code.slice(12),
    interpretation: 'Los dígitos 7-11 pueden representar peso o precio',
  };
}
