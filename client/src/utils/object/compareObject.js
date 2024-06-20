function isObjectOrArray(item) {
    return item != null && (typeof item === 'object' || Array.isArray(item));
}

export function compareObjects({
    object1,
    object2,
    currentDepth = 0,
    maxDepth = 2,
    strictTypeCheck = true
}) {
    if (currentDepth > maxDepth) {
        return true; // Detener la comparación más allá de la profundidad máxima especificada
    }

    if ((strictTypeCheck && object1 === object2) || (!strictTypeCheck && isEqualValue(object1, object2))) {
        return true;
    }

    if (!isObjectOrArray(object1) || !isObjectOrArray(object2)) {
        return false;
    }

    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (Object.hasOwn(object2, key)) {
            const val1 = object1[key];
            const val2 = object2[key];
            const areItems = isObjectOrArray(val1) && isObjectOrArray(val2);
            if (areItems && !compareObjects({
                object1: val1,
                object2: val2,
                currentDepth: currentDepth + 1,
                maxDepth,
                strictTypeCheck
            }) || (!areItems && (strictTypeCheck ? val1 !== val2 : !isEqualValue(val1, val2)))) {
                return false;
            }
        } else {
            return false; // La propiedad no existe en uno de los objetos
        }
    }

    return true;
}

function isEqualValue(val1, val2) {
    if (typeof val1 === 'number' && typeof val2 === 'number') {
        return val1 === val2;
    }
    return String(val1) === String(val2);
}
