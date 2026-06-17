export const readAiBusinessSeedingString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

export const normalizeAiBusinessSeedingText = (value) =>
  readAiBusinessSeedingString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
