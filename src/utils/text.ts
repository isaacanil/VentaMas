const DIACRITIC_MARKS_REGEX = /[\u0300-\u036f]/g;

export const stripDiacritics = (text: string): string =>
  text.normalize('NFD').replace(DIACRITIC_MARKS_REGEX, '');

export const normalizeText = (text: string): string => {
  return stripDiacritics(text).toLowerCase();
};

export const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const cleanString = toCleanString;

/**
 * Capitaliza la primera letra de una palabra
 */
export const firstLetter = (word: string | null | undefined): string => {
  if (word !== undefined && word !== null && word !== '') {
    const wordStr = String(word);
    const first = wordStr[0].toUpperCase();
    const rest = wordStr.toLowerCase().slice(1);
    return first + rest;
  } else {
    return '';
  }
};

/**
 * Convierte un valor a string, retornando string vacío si es null o undefined
 */
export const parseToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  } else {
    return String(value);
  }
};

/**
 * Extrae y retorna las coincidencias de un string usando una regex
 */
export const removeMatchesString = (
  string: string | null | undefined,
  matches: RegExp,
): string => {
  const paragraph = String(string || '');
  const found = paragraph.match(matches);
  return found ? found.toString() : '';
};
