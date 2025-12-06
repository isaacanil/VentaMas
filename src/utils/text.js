export const normalizeText = (text) => {
  return text
    .normalize('NFD') // Descompone caracteres con diacríticos
    .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos
    .toLowerCase(); // Convierte todo a minúsculas
};
