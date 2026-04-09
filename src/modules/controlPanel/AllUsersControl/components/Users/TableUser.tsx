import { Button, Table } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { ChangerPasswordModal } from './ChangerPasswordModal';

import type { FC } from 'react';
import type { TableProps } from 'antd';

interface UserInfo {
  id?: string;
  name?: string;
  businessID?: string;
  role?: string;
  active?: boolean;
  loginAttempts?: number;
}

export interface UserRow {
  id: string;
  uid?: string;
  name?: string;
  businessID?: string;
  role?: string;
  active?: boolean;
  loginAttempts?: number;
}

interface TableUserProps {
  users?: UserRow[];
}

interface BusinessIdFilterOption {
  text: string;
  value: string;
}

const EMPTY_USERS: UserRow[] = [];

export const TableUser: FC<TableUserProps> = ({ users = EMPTY_USERS }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userSelected, setUserSelected] = useState<UserRow | null>(null);
  const userList = Array.isArray(users) ? users : [];
  const businessIDFilters = userList.reduce<BusinessIdFilterOption[]>(
    (acc, current) => {
      if (current?.businessID) {
        const businessID = current.businessID;
        if (!acc.find((filter) => filter.value === businessID)) {
          acc.push({
            text: businessID,
            value: businessID,
          });
        }
      }
      return acc;
    },
    [],
  );
  const columnas: TableProps<UserRow>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'businessID',
      dataIndex: 'businessID',
      key: 'businessID',
      filters: businessIDFilters,
      onFilter: (value, record) => record?.businessID === value,
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Activo',
      dataIndex: 'active',
      key: 'active',
      render: (_text, record) => (record.active ? 'Sí' : 'No'),
    },
    {
      title: 'Intentos de Ingreso',
      dataIndex: 'loginAttempts',
      key: 'loginAttempts',
    },
    {
      title: 'Acción',
      key: 'action',
      render: (_text, record) => {
        const handleOpenModal = () => {
          setIsOpen(true);
          setUserSelected(record);
        };
        return (
          <span>
            <Button onClick={handleOpenModal}>Editar</Button>
          </span>
        );
      },
    },
    // Puedes agregar más columnas según necesites
  ];
  const pagination: TableProps<UserRow>['pagination'] = {
    pageSize: 6,
  };

  return (
    <Container>
      <Table
        pagination={pagination}
        columns={columnas}
        dataSource={userList}
        rowKey="id"
      />
      <ChangerPasswordModal
        isOpen={isOpen}
        data={userSelected}
        onClose={() => setIsOpen(false)}
      />
    </Container>
  );
};

const Container = styled.div``;
