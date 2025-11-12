import { Table, Button } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { ChangerPasswordModal } from './ChangerPasswordModal';

export const TableUser = ({ users = [] }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [userSelected, setUserSelected] = useState(null)
    const userList = Array.isArray(users) ? users : []
    const businessIDFilters = userList.reduce((acc, current) => {
        // Check if current and current.user exist before accessing businessID
        if (current && current.user && current.user.businessID) {
            const businessID = current.user.businessID;
            if (!acc.find(filter => filter.value === businessID)) {
                acc.push({
                    text: businessID,
                    value: businessID,
                });
            }
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
        },        {
            title: 'businessID',
            dataIndex: ['user', 'businessID'],
            key: 'businessID',
            filters: businessIDFilters,
            onFilter: (value, record) => record?.user?.businessID === value,
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
    const pagination = {
        pageSize: 6,
      
    };

    return (
        <Container>
            <Table pagination={pagination} columns={columnas} dataSource={userList} rowKey="id" />
            <ChangerPasswordModal 
            isOpen={isOpen} 
            data={userSelected}
            onClose={() => setIsOpen(false)}
            />
        </Container>

    );
};

const Container = styled.div`
    
`
