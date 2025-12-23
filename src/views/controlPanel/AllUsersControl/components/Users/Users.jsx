import React, { useEffect, useMemo, useState } from 'react';

import { fbGetUsers } from '@/firebase/Auth/fbGetUser';
import { fbGetBusinessesList } from '@/firebase/dev/businesses/fbGetBusinessesList';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';

import { TableUser } from './TableUser';
import { UsersFilterBar } from './UsersFilterBar';

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    businessID: '',
    role: '',
  });
  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        const [usersResponse, businessesResponse] = await Promise.all([
          fbGetUsers(),
          fbGetBusinessesList(),
        ]);

        if (isMounted) {
          setUsers(Array.isArray(usersResponse) ? usersResponse : []);
          setBusinesses(
            Array.isArray(businessesResponse) ? businessesResponse : [],
          );
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        if (isMounted) {
          setUsers([]);
          setBusinesses([]);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const businessNameMap = useMemo(() => {
    return businesses.reduce((map, businessDoc) => {
      const businessId = businessDoc?.id;
      if (!businessId) {
        return map;
      }

      const name = businessDoc?.business?.name || businessDoc?.name || '';
      map.set(String(businessId), name);
      return map;
    }, new Map());
  }, [businesses]);

  const businessOptions = useMemo(() => {
    return businesses.map((businessDoc) => {
      const value = String(businessDoc?.id ?? '');
      const name = businessDoc?.business?.name || businessDoc?.name || value;

      return {
        value,
        id: value,
        name,
        searchText: `${name ?? ''} ${value}`.trim().toLowerCase(),
      };
    });
  }, [businesses]);

  const roleOptions = useMemo(() => {
    const set = new Set();

    users.forEach((item) => {
      const role = item?.user?.role;
      if (role) {
        set.add(String(role));
      }
    });

    return Array.from(set).map((value) => ({
      value,
      label: value,
      searchText: value.toLowerCase(),
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    return users.filter((item) => {
      const info = item?.user || {};

      const matchesBusiness = filters.businessID
        ? String(info.businessID) === filters.businessID
        : true;
      const matchesRole = filters.role
        ? String(info.role) === filters.role
        : true;
      const matchesSearch = term
        ? [
            info.id,
            info.name,
            info.businessID,
            info.role,
            businessNameMap.get(String(info.businessID)),
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term))
        : true;

      return matchesBusiness && matchesRole && matchesSearch;
    });
  }, [filters, users, businessNameMap]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  return (
    <div>
      <MenuApp sectionName={'Usuarios'} />
      <UsersFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        businessOptions={businessOptions}
        roleOptions={roleOptions}
      />
      <TableUser users={filteredUsers} />
    </div>
  );
};
