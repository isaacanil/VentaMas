const essentialFieldsEs = [
  "Código QR",
  "Categoría",
  "Nombre",
  "Precio de Lista",
  "Precio Promedio",
  "Precio Mínimo",
  "Impuesto",
  "Costo",
  "Tamaño",
  "Stock",
  "Código de Barras"
];
const essentialFieldsEn = [
  "QR Code",
  "Category",
  "Name",
  "List Price",
  "Average Price",
  "Minimum Price",
  "Tax",
  "Cost",
  "Size",
  "Stock",
  "Barcode"
];
const languages = {
  es: essentialFieldsEs,
  en: essentialFieldsEn
}

export const filterEssentialHeaders = (headerMappings, language = 'es') => {
  const headers = headerMappings[language];

  // Seleccionar los campos esenciales según el idioma
  const essentialFields = languages[language];

  // Filtrar solo los campos esenciales
  const filteredHeaders = Object.keys(headers)
    .filter(key => essentialFields.includes(key))

  return filteredHeaders;
};

