import { faArrowDownAZ, faArrowUpAZ } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';

import { FilterBar as CommonFilterBar } from '@/components/common/FilterBar';

export const FilterCashReconciliation = ({
    filters,
    onFiltersChange,
    sortAscending,
    onSortChange,
    userOptions = [],
}) => {
    const handleDateChange = useCallback((range) => {
        onFiltersChange({ ...filters, createdAtDateRange: range });
    }, [filters, onFiltersChange]);

    const handleStatusChange = useCallback((value) => {
        onFiltersChange({ ...filters, status: value });
    }, [filters, onFiltersChange]);

    const handleUserChange = useCallback((value) => {
        onFiltersChange({ ...filters, user: value });
    }, [filters, onFiltersChange]);

    const handleClearFilters = useCallback(() => {
        onFiltersChange({
            createdAtDateRange: null,
            status: null,
            user: null,
        });
    }, [onFiltersChange]);

    const hasActiveFilters = useMemo(() => {
        return (
            (filters.createdAtDateRange?.startDate && filters.createdAtDateRange?.endDate) ||
            filters.status ||
            filters.user
        );
    }, [filters]);

    const items = useMemo(
        () => [
            {
                key: 'date',
                section: 'main',
                minWidth: 220,
                wrap: false,
                label: 'Fechas',
                type: 'dateRange',
                value: filters.createdAtDateRange,
                onChange: handleDateChange,
                isActive: (value) => value?.startDate || value?.endDate,
            },
            {
                key: 'status',
                section: 'main',
                label: 'Estado',
                type: 'select',
                value: filters.status,
                onChange: handleStatusChange,
                options: [
                    { label: 'Abierto', value: 'open' },
                    { label: 'Cerrando Cuadre', value: 'closing' },
                    { label: 'Cerrado', value: 'closed' },
                ],
                placeholder: 'Estado',
                controlStyle: { width: 150 },
            },
            {
                key: 'user',
                section: 'main',
                label: 'Usuario',
                type: 'select',
                value: filters.user,
                onChange: handleUserChange,
                options: userOptions,
                placeholder: 'Usuario',
                showSearch: true,
                controlStyle: { width: 180 },
                filterOption: (input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
            },
            {
                key: 'sort',
                section: 'main',
                label: 'Ordenar',
                wrap: false,
                render: () => (
                    <Button
                        icon={<FontAwesomeIcon icon={sortAscending ? faArrowUpAZ : faArrowDownAZ} />}
                        onClick={() => onSortChange(!sortAscending)}
                    >
                        {sortAscending ? 'Ascendente' : 'Descendente'}
                    </Button>
                ),
                value: sortAscending,
            },
        ],
        [filters, userOptions, sortAscending, onSortChange, handleDateChange, handleStatusChange, handleUserChange]
    );

    return (
        <CommonFilterBar
            items={items}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            labels={{
                drawerTrigger: 'Filtros',
                drawerTitle: 'Filtros',
                modalTitle: 'Filtros adicionales',
                more: 'Más filtros',
                clear: 'Limpiar',
            }}
        />
    );
};

FilterCashReconciliation.propTypes = {
    filters: PropTypes.object.isRequired,
    onFiltersChange: PropTypes.func.isRequired,
    sortAscending: PropTypes.bool,
    onSortChange: PropTypes.func,
    userOptions: PropTypes.array,
};
