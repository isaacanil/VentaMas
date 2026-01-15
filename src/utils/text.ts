export const normalizeText = (text: string): string => {
  return text
    .normalize('NFD') // Descompone caracteres con diacríticos
    .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos
    .toLowerCase(); // Convierte todo a minúsculas
};

/**
 * Capitaliza la primera letra de una palabra
 */
export const firstLetter = (word: string | null | undefined): string => {
  if (word !== undefined && word !== null && word !== '') {
    const wordStr = String(word);
    let first = wordStr[0].toUpperCase();
    let rest = wordStr.toLowerCase().slice(1);
    return first + rest;
  } else {
    return '';
  }
};

/**
 * Convierte un valor a string, retornando string vacío si es null o undefined
 */
export const parseToString = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  } else {
    return String(value);
  }
};

/**
 * Extrae y retorna las coincidencias de un string usando una regex
 */
export const removeMatchesString = (string: string | null | undefined, matches: RegExp): string => {
  let paragraph = String(string || '');
  let found = paragraph.match(matches);
  return found ? found.toString() : '';
};
