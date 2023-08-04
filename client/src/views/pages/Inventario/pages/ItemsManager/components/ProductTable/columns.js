const columns = [
    {
        title: 'Nombre',
        dataIndex: 'name',
        key: 'name',
        width: '20%',
        sorter: (a, b) => a.name.localeCompare(b.name),
        sortDirections: ['descend', 'ascend'],
    
    },
    {
        title: 'Descripción',
        dataIndex: 'description',
        key: 'description',
        width: '20%',
        sorter: (a, b) => a.description.localeCompare(b.description),
        sortDirections: ['descend', 'ascend'],
    },
]