import { Button, Dropdown, Select } from 'antd'

import { HeaderBar, Controls, SearchInput, SortButton } from './InventoryControl.styles'

export function InventoryHeaderBar({
  search,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
  sortDir,
  onToggleSort,
  exportMenuItems,
  onExportMenuClick,
}) {
  return (
    <HeaderBar>
      <Controls>
        <SearchInput
          type="text"
          placeholder="Buscar por producto o batch..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          value={stockFilter}
          onChange={onStockFilterChange}
          style={{ width: 180 }}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'with', label: 'Con stock' },
            { value: 'without', label: 'Sin stock' },
          ]}
        />
        <SortButton onClick={onToggleSort}>
          {sortDir === 'asc' ? 'A→Z' : 'Z→A'}
        </SortButton>
      </Controls>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Dropdown menu={{ items: exportMenuItems, onClick: onExportMenuClick }} placement="bottomRight" trigger={['click']}>
          <Button type="default">Exportar ⬇️</Button>
        </Dropdown>
      </div>
    </HeaderBar>
  )
}

export default InventoryHeaderBar

