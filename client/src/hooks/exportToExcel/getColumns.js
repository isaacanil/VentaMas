function getColumns(data, prefix = '') {
    const columns = [];
    for (let key in data) {
      if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
        if (key !== 'delivery') { // Omitir la propiedad anidada 'delivery'
          const subColumns = getColumns(data[key], `${prefix}${key}.`);
          columns.push(...subColumns);
        }
      } else {
        columns.push({
          header: `${prefix}${key}`,
          key: `${prefix}${key}`
        });
      }
    }
    return columns;
  }
  
  export default getColumns;
  