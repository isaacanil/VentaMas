// mapData.js
export const mapData = ({ data, headerMapping, language = 'es' }) => {
  if (!headerMapping?.[language]) return [];

  const languageMapping = headerMapping[language];

  return data.map(item => {
    const mappedItem = {};

    Object.entries(languageMapping).forEach(([headerKey, mappedKey]) => {
      let value = item[headerKey];

      // Solo aplica trim si el valor es una cadena
      if (typeof value === 'string') {
        value = value.trim();
      }

      // Asignar el valor al campo mapeado
      setNestedValue(mappedItem, mappedKey, value);
    });

    return mappedItem;
  });
};

// Helper function to safely set nested values
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = current[key] || {};
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}
