import { Input, Select, Space } from 'antd'
import { useMemo } from 'react'

const optionContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.2,
}

const optionPrimaryStyle = {
  fontWeight: 500,
}

const optionSecondaryStyle = {
  fontSize: 12,
  color: '#6b7280',
}

export const UsersFilterBar = ({ filters, onFilterChange, businessOptions, roleOptions }) => {
  const handleSearchChange = (event) => {
    onFilterChange('search', event.target.value ?? '')
  }

  const handleBusinessChange = (value) => {
    onFilterChange('businessID', value ?? '')
  }

  const handleRoleChange = (value) => {
    onFilterChange('role', value ?? '')
  }

  const businessSelectOptions = useMemo(
    () =>
      businessOptions.map((option) => {
        const name = option.name ?? option.label ?? option.value
        const id = option.id ?? option.value
        const searchText = option.searchText ?? `${name ?? ''} ${id ?? ''}`.toLowerCase()

        return {
          value: option.value,
          label: (
            <div style={optionContainerStyle}>
              <span style={optionPrimaryStyle}>{name}</span>
              <span style={optionSecondaryStyle}>ID: {id}</span>
            </div>
          ),
          name,
          searchText,
        }
      }),
    [businessOptions]
  )

  const roleSelectOptions = useMemo(
    () =>
      roleOptions.map((option) => {
        const value = option.value ?? option
        const label = option.label ?? value
        const searchText = option.searchText ?? String(label).toLowerCase()

        return {
          value,
          label,
          searchText,
        }
      }),
    [roleOptions]
  )

  return (
    <div style={{ margin: '16px 0', padding: '0 16px' }}>
      <Space size="middle" wrap>
        <Input
          placeholder="Buscar por nombre, ID, negocio o rol"
          value={filters.search}
          onChange={handleSearchChange}
          allowClear
        />
        <Select
          placeholder="Filtrar por negocio"
          value={filters.businessID || undefined}
          onChange={handleBusinessChange}
          allowClear
          style={{ minWidth: 240 }}
          options={businessSelectOptions}
          showSearch
          optionLabelProp="name"
          filterOption={(input, option) =>
            (option?.searchText ?? '').includes(input.trim().toLowerCase())
          }
        />
        <Select
          placeholder="Filtrar por rol"
          value={filters.role || undefined}
          onChange={handleRoleChange}
          allowClear
          style={{ minWidth: 180 }}
          options={roleSelectOptions}
          showSearch
          optionFilterProp="label"
          filterOption={(input, option) =>
            (option?.searchText ?? '').includes(input.trim().toLowerCase())
          }
        />
      </Space>
    </div>
  )
}
