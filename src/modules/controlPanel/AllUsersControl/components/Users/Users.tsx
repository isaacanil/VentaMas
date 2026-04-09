import React, { useEffect, useMemo, useState } from 'react';

import { fbGetUsers } from '@/firebase/Auth/fbGetUser';
import { fbGetBusinessesList } from '@/firebase/dev/businesses/fbGetBusinessesList';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { TableUser } from './TableUser';
import { UsersFilterBar } from './UsersFilterBar';

import type { UserRow } from './TableUser';
import type {
  BusinessOption,
  RoleOption,
  UsersFilterBarFilters,
} from './UsersFilterBar';

interface BusinessDoc {
  id?: string;
  business?: {
    name?: string;
  };
  name?: string;
}

const toArray = <T,>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

export const Users: React.FC = () => {
  const [dataState, setDataState] = useState<{
    users: UserRow[];
    businesses: BusinessDoc[];
  }>({
    users: [],
    businesses: [],
  });
  const [filters, setFilters] = useState<UsersFilterBarFilters>({
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
          setDataState({
            users: toArray<UserRow>(usersResponse),
            businesses: toArray<BusinessDoc>(businessesResponse),
          });
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        if (isMounted) {
          setDataState({
            users: [],
            businesses: [],
          });
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);
  const { users, businesses } = dataState;

  const businessNameMap = useMemo(() => {
    return businesses.reduce<Map<string, string>>((map, businessDoc) => {
      const businessId = businessDoc?.id;
      if (!businessId) {
        return map;
      }

      const name = businessDoc?.business?.name || businessDoc?.name || '';
      map.set(String(businessId), name);
      return map;
    }, new Map<string, string>());
  }, [businesses]);

  const businessOptions = useMemo<BusinessOption[]>(() => {
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

  const roleOptions = useMemo<RoleOption[]>(() => {
    const set = new Set<string>();

    users.forEach((item) => {
      const role = item?.role;
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
      const info = item || ({} as UserRow);

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

  const handleFilterChange = (
    key: keyof UsersFilterBarFilters,
    value: string,
  ) => {
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
