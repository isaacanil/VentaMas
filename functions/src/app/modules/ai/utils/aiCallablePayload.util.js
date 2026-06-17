export const readAiCallableObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};
