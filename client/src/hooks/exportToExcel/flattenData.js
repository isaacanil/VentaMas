function flattenData(data, prefix = '') {
    const rowData = {};
    for (let key in data) {
      if (key === 'id') { // Agregar la propiedad 'id' primero en cada fila
        rowData[`${prefix}${key}`] = data[key];
      } else if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
        if (key !== 'delivery') { // Omitir la propiedad anidada 'delivery'
          const subData = flattenData(data[key], `${prefix}${key}.`);
          Object.assign(rowData, subData);
        }
      } else {
        rowData[`${prefix}${key}`] = data[key];
      }
    }
    return rowData;
  }


    export default flattenData;
  
  