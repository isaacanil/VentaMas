import React, { useState } from 'react';
import * as antd from 'antd';
import { ChangerPasswordModal } from './ChangerPasswordModal';
const { Table, Button } = antd;

export const TableUser = ({ users }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [userSelected, setUserSelected] = useState(null)
    const businessIDFilters = users.reduce((acc, current) => {
        const businessID = current.user.businessID;
        if (!acc.find(filter => filter.value === businessID)) {
            acc.push({
                text: businessID,
                value: businessID,
            });
        }
        return acc;
    }, []);
    const columnas = [
        {
            title: 'ID',
            dataIndex: ['user', 'id'],
            key: 'id',
        },
        {
            title: 'Nombre',
            dataIndex: ['user', 'name'],
            key: 'name',
        },
        {
            title: 'businessID',
            dataIndex: ['user', 'businessID'],
            key: 'businessID',
            filters: businessIDFilters,
            onFilter: (value, record) => record.user.businessID === value,
        },
        {
            title: 'Rol',
            dataIndex: ['user', 'role'],
            key: 'role',
        },
        {
            title: 'Activo',
            dataIndex: ['user', 'active'],
            key: 'active',
            render: (text, record) => (record.user.active ? 'Sí' : 'No'),
        },
        {
            title: 'Intentos de Ingreso',
            dataIndex: ['user', 'loginAttempts'],
            key: 'loginAttempts',
        },
        {
            title: 'Acción',
            key: 'action',
            render: (text, record) => {
                 const handleOpenModal = () => {
                    setIsOpen(true)
                    alert(JSON.stringify(record))
                    setUserSelected(record)
                 }
                return (
                    <span>
                        <Button onClick={handleOpenModal}>
                            Editar
                        </Button>
                    </span>
                )
            },
        }
        // Puedes agregar más columnas según necesites
    ];

    return (
        <div>
            <Table columns={columnas} dataSource={users} rowKey="id" />
            <ChangerPasswordModal 
            isOpen={isOpen} 
            data={userSelected}
            onClose={() => setIsOpen(false)}
            />
        </div>

    );
};


