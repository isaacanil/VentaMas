export const useUpdateObjectInArray = (array, setArray, key, newValue, searchKey, searchValue) => {
    // hacemos una copia del array original
    let newArray = [...array];
    switch (dataType) {
        case 'string':
            newValue = String(newValue);
            break;
        case 'number':
            newValue = Number(newValue);
            break;
        default:
            break;
    }
    if (newValue.length > maxCharacters) {
        newValue = newValue.slice(-maxCharacters);
        setTimeout(()=>{newValue = newValue.substring(0, maxCharacters)}, 1)
        
    }
    // buscamos el objeto en el array que tiene el valor de searchKey que estamos buscando
    let item = newArray.find(item => item[searchKey] === searchValue);
    // si encontramos el objeto, modificamos su valor
    if (item) {
        item[key] = newValue;
    }
    // retornamos el nuevo array
    setArray(newArray)
}
