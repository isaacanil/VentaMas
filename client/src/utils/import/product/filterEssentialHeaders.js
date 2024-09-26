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
  
  export const filterEssentialHeaders = (headerMappings, language = 'es') => {
    const headers = headerMappings[language];
    
    // Seleccionar los campos esenciales según el idioma
    const essentialFields = language === 'es' ? essentialFieldsEs : [
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
  
    // Filtrar solo los campos esenciales
    const filteredHeaders = Object.keys(headers)
      .filter(key => essentialFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = headers[key];
        return obj;
      }, {});
  
    return filteredHeaders;
  };
  
  // Ejemplo de uso
  const essentialHeadersEs = filterEssentialHeaders(productHeaderMappings, 'es');
  console.log(essentialHeadersEs);
  