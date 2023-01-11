import { useEffect } from "react";

export const updateFieldInArrayObject = (array, setArray, propertyId, propertyToChangeValue, newValue, maxCharacters = 30) => {
    if (Array.isArray(array) && array.length > 0) {
        const index = array.findIndex((p) => p.name === propertyId);
        if (index === -1) {
            console.error(`No se ha encontrado ningún objeto con la propiedad 'name' igual a '${propertyId}' en el array.`);
            return;
        }
        if (!array[index].hasOwnProperty(propertyToChangeValue)) {
            console.error(`El objeto en el índice ${index} no tiene una propiedad llamada '${propertyToChangeValue}'.`);
            return;
        }
        if (newValue.length > maxCharacters) {
            newValue = newValue.substring(0, maxCharacters);
        }
        array[index][propertyToChangeValue] = newValue;
        setArray([...array]);
    } else {
        console.error("El argumento 'array' no es un array.");
    }
}
export const findPropertyObjectArray = (array, id, property) => {
    useEffect(() => {
        const ObjectSelected = array.length > 0 ? array.find((object) => object.id === id) : null;
        if (ObjectSelected) {
            setArray(ObjectSelected[property])
        }
        console.log(array)
    }, [array])
    return array
}

export function getInputValue(array, propertyId, propertyToChangeValue) {
    if (array.length === 0) {
        return null;
    }

    const property = array.find((property) => property.name === propertyId);
    if (!property) {
        return null;
    }

    return property[propertyToChangeValue];
}