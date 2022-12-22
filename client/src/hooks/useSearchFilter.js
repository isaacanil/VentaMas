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