import _ from 'lodash';
export const updateObject = (object, e) => {
    const { name, type } = e.target;
    let value;

    switch (type) {
        case 'checkbox':
            value = e.target.checked;
            break;
        case 'number':
            value = Number(e.target.value) || 0;  // Retorna el valor como un número
            break;
        // Añade más casos según sea necesario...
        default:
            value = e.target.value;
    }
  
    // Hacemos una copia profunda del objeto usando JSON.stringify y JSON.parse
    let objectCopy = JSON.parse(JSON.stringify(object));
  
    const keys = name.split('.');
    let currentObj = objectCopy;
  
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
  
        if (i === keys.length - 1) {
            currentObj[key] = value;
        } else {
            currentObj[key] = currentObj[key] || {};
            currentObj = currentObj[key];
        }
    }
  
    return objectCopy;
};
