const MAX_DEPTH = 3;

const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const searchInString = (string, term) => {
    const stringWithoutAccents = removeAccents(string.toLowerCase());
    const termWithoutAccents = removeAccents(term.toLowerCase());
    return stringWithoutAccents.includes(termWithoutAccents);
};

const searchInNumber = (number, term) => number.toString().includes(term);

const searchInArray = (array, terms) => array.some(item => searchInObject(item, terms));

const searchInObject = (object, terms, depth = 0) => {
    if (depth > MAX_DEPTH) return false; // Detiene la búsqueda si se excede la profundidad máxima
    return Object.values(object).some(value => searchInProperty(value, terms, depth + 1));
};

const searchInProperty = (property, terms, depth = 0) => {
    if (!property) { return false }
    for (const term of terms) {
        switch (typeof property) {
            case 'string':
                if (searchInString(property, term)) return true;
                break;
            case 'number':
                if (searchInNumber(property, term)) return true;
                break;
            case 'object':
                if (Array.isArray(property)) {
                    // Corrección aplicada aquí para pasar correctamente el parámetro `depth`
                    if (searchInArray(property, terms, depth + 1)) return true;
                } else if (property instanceof Date) {
                    if (searchInString(property.toISOString(), term)) return true;
                } else {
                    // Aquí también aseguramos el seguimiento correcto de la profundidad
                    if (searchInObject(property, terms, depth + 1)) return true;
                }
                break;
        }
    }
    return false;
};

const filterDataWithTerms = (array, terms) => {
    return array.filter(item => searchInObject(item, terms));
};

export const filterData = (array, searchTerm) => {
    !array && (array = []);
    if (!Array.isArray(array)) {
        throw new Error('The first parameter must be an array');
    }
    if (typeof searchTerm !== 'string') {
        throw new Error('The second parameter must be a string');
    }

    const terms = searchTerm.toLowerCase().split(' ');
    const exactMatchResults = filterDataWithTerms(array, [searchTerm.toLowerCase()]);

    if (exactMatchResults.length > 0) {
        return exactMatchResults;
    }

    if (terms.length > 1) {
        return filterDataWithTerms(array, terms);
    }

    return filterDataWithTerms(array, [searchTerm.toLowerCase()]);
};
