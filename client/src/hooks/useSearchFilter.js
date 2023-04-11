import { useEffect, useState } from "react";

export const useSearchFilter = (clients, searchTerm) => {
    const [filteredClients, setFilterClients] = useState(clients)
    useEffect(() => {
        if (String(searchTerm).trim() === '') {
            setFilterClients(clients)
            return;
        }
        const serachRegex = new RegExp(searchTerm, 'i');
        const filtered = clients.filter(({ client }) => serachRegex.test(client.name))
        setFilterClients(filtered)
    }, [clients, searchTerm])
    return filteredClients;
}

export const useSearchFilterX = (list, searchTerm, filterField) => {
    const [filteredList, setFilteredList] = useState(list)
    useEffect(() => {
        if (String(searchTerm).trim() === '') {
            setFilteredList(list)
            return;
        }
        const searchRegex = new RegExp(searchTerm, 'i');
        const filtered = list.filter(item => searchRegex.test(item[filterField.split(".")[0]][filterField.split(".")[1]]))
        setFilteredList(filtered)
    }, [list, searchTerm, filterField])
    return filteredList;
}


export const useSearchFilterOrderMenuOption = (data, searchTerm) => {
    const [filteredData, setFilteredData] = useState(data);

    useEffect(() => {
        if (String(searchTerm).trim() === '') {
            setFilteredData(data)
            return;
        }
        const searchRegex = new RegExp(searchTerm, 'i');
        const filtered = data.filter((item) => searchRegex.test(item.name))
        setFilteredData(filtered.slice(0, 3))
    }, [searchTerm, data]);
    return filteredData;
}

export function searchAndFilter(products, searchQuery) {
    const searchTerms = searchQuery.trim().toLowerCase().split(' ');

    const deepStringify = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
            return String(obj);
        }

        return Object.values(obj)
            .map(value => deepStringify(value))
            .join(' ');
    };

    return products.filter(({ product }) => {
        const productString = deepStringify(product).toLowerCase();
        return searchTerms.every(term => productString.includes(term));
    });
}

export const filtrarDatos = (array, searchTerm) => {
    if (!searchTerm) {return array}
    const term = searchTerm.toLowerCase();
    return array.filter(item => buscarEnPropiedades(item, term));
};

const buscarEnPropiedades = (objeto, term) => {
    return Object.values(objeto).some(value => {
        if (typeof value === 'string' || typeof value === 'number') {
            return value.toString().toLowerCase().includes(term);
        } else if (Array.isArray(value)) {
            return value.some(item => buscarEnPropiedades(item, term));
        } else if (typeof value === 'object' && value !== null) {
            return buscarEnPropiedades(value, term);
        }
        return false;
    });
};
