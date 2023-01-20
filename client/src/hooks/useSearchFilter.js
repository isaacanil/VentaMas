import { useEffect, useState } from "react";

export const useSearchFilter = (clients, searchTerm ) => {
    const [filteredClients, setFilterClients] = useState(clients)
    useEffect(() => {
        if(String(searchTerm).trim() === ''){
            setFilterClients(clients)
            return;
        }
        const serachRegex = new RegExp(searchTerm, 'i');
        const filtered = clients.filter(({client}) => serachRegex.test(client.name))
        setFilterClients(filtered)
    }, [clients, searchTerm])
    return filteredClients;
}

export const useSearchFilterX = (list, searchTerm, filterField) => {
    const [filteredList, setFilteredList] = useState(list)
    useEffect(() => {
        if(String(searchTerm).trim() === ''){
            setFilteredList(list)
            return;
        }
        
        const searchRegex = new RegExp(searchTerm, 'i');
        const filtered = list.filter(item => searchRegex.test(item[filterField.split(".")[0]][filterField.split(".")[1]]))
        setFilteredList(filtered)
    }, [list, searchTerm, filterField])
    return filteredList;
}


export const useSearchFilterOrderMenuOption = (data, searchTerm ) => {
    const [filteredData, setFilteredData] = useState(data.Items);
    useEffect(() => {
        console.log(data.Items.filter((item)=>console.log(item)))
        // if(data.length > 0){
        //     const filtered = data.Items.filter((item) => {
        //         console.log(item)
        //     });
        //     setFilteredData(filtered);
        // }
    }, [searchTerm, data]);
    console.log(filteredData)
    return filteredData;
}