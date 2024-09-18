const MAX_DEPTH = 3;

const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const searchInString = (string, term) => {
    const stringWithoutAccents = removeAccents(string.toLowerCase());
    const termWithoutAccents = removeAccents(term.toLowerCase());
    return stringWithoutAccents.includes(termWithoutAccents);
};

const searchInNumber = (number, term) => number.toString().toLowerCase().includes(term.toLowerCase());

const searchInArray = (array, term) => array.some(item => searchInObject(item, term));

const searchInObject = (object, term, depth = 0) => {
    if (depth > MAX_DEPTH) return false;
    return Object.values(object).some(value => searchInProperty(value, term, depth + 1));
};

const searchInProperty = (property, term, depth = 0) => {
    if (!property) return false;
    
    switch (typeof property) {
        case 'string':
            return searchInString(property, term);
        case 'number':
            return searchInNumber(property, term);
        case 'object':
            if (Array.isArray(property)) {
                return searchInArray(property, term, depth + 1);
            } else if (property instanceof Date) {
                return searchInString(property.toISOString(), term);
            } else {
                return searchInObject(property, term, depth + 1);
            }
        default:
            return false;
    }
};

const filterDataWithTerm = (array, term) => {
    return array.filter(item => searchInObject(item, term));
};

export const filterData = (array, searchTerm) => {
    if (!array || !Array.isArray(array)) {
        throw new Error('The first parameter must be an array');
    }
    if (typeof searchTerm !== 'string') {
        throw new Error('The second parameter must be a string');
    }

    if (searchTerm.trim() === '') {
        return array;
    }

    return filterDataWithTerm(array, searchTerm.trim().toLowerCase());
};