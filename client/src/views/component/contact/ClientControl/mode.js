export const Mode = (value, setLabel) => {
    if(value === 'updateClient'){
        setLabel('Actualizar Cliente')
    }
    if(value === 'createClient'){
        setLabel('Crear Cliente')
    }
    if(value === 'searchClient'){
        setLabel('Buscar Cliente')
    }
}