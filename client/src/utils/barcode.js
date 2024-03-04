export const extractProductInfo = (barcode) => {
    // Implementa la lógica para extraer la información del producto
    return barcode.slice(2, 7);
};

export const extractWeightInfo = (barcode) => {
    // Implementa la lógica para extraer la información del peso
    const weight = barcode.slice(-6);
    // redondear, weight seria 6 numeros que tendria que tomar las dos primeras cifras y luego de lla poner un punbto decimal ejemplo 006164 seria 00.616 que al final en verdad que dareiqa 0.616
    return weight;
};

export const formatWeight = (weightString) => {
    const integerPart = parseInt(weightString.slice(0, 2), 10);
    const decimalPart = parseInt(weightString.slice(2), 10);
    let weight = integerPart + decimalPart / 10000;
    return parseFloat(weight.toFixed(3));
};

