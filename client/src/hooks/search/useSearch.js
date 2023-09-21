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

const searchInObject = (object, terms) => Object.values(object).some(value => searchInProperty(value, terms));

const searchInProperty = (property, terms) => {
    for (const term of terms) {
        if (!property) { continue }
        switch (typeof property) {
            case 'string':
                if (searchInString(property, term)) return true;
                break;
            case 'number':
                if (searchInNumber(property, term)) return true;
                break;
            case 'object':
                if (Array.isArray(property)) {
                    if (searchInArray(property, terms)) return true;
                } else if (property instanceof Date) {
                    if (searchInString(property.toISOString(), term)) return true;
                } else {
                    if (searchInObject(property, terms)) return true;
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
