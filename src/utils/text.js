export const normalizeText = (text) => {
  return text
    .normalize('NFD') // Descompone caracteres con diacríticos
    .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos
    .toLowerCase(); // Convierte todo a minúsculas
};

/**
 * Capitaliza la primera letra de una palabra
 */
export const firstLetter = (word) => {
  if (word !== undefined && word !== null && word !== '') {
    let first = String(word)[0].toUpperCase();
    let rest = String(word).toLowerCase().slice(1);
    return (word = first + rest);
  } else {
    return '';
  }
};

/**
 * Convierte un valor a string, retornando string vacío si es null o undefined
 */
export const parseToString = (value) => {
  if (value === null || value === undefined) {
    value = '';
    return value;
  } else {
    return value;
  }
};

/**
 * Extrae y retorna las coincidencias de un string usando una regex
 */
export const removeMatchesString = (string, matches) => {
  let paragraph = String(string);
  let regex = matches;
  let found = paragraph.match(regex);
  found = found.toString();
  return found;
};
