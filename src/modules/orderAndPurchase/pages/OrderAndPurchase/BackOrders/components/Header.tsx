import {
  SearchOutlined,
  SortAscendingOutlined,
  DownloadOutlined,
} from '@/constants/icons/antd';
import { Button, Select } from 'antd';

import type {
  BackorderSort,
  BackorderStats,
  BackorderStatusFilter,
  DateRangeValue,
} from '../types';
import {
  ExportAction,
  FilterField,
  FiltersWrapper,
  HeaderContainer,
  HeaderStats,
  Label,
  RangeInput,
  SearchInput,
  SelectControl,
  StatBox,
  StatLabel,
  StatValue,
} from './Header.styles';

const { Option } = Select;

const sortOptions = [
  { value: 'name-asc', label: 'Nombre (A-Z)' },
  { value: 'name-desc', label: 'Nombre (Z-A)' },
  { value: 'pending-desc', label: 'Mayor cantidad pendiente' },
  { value: 'pending-asc', label: 'Menor cantidad pendiente' },
  { value: 'date-desc', label: 'Mas recientes' },
  { value: 'date-asc', label: 'Mas antiguos' },
  { value: 'progress-desc', label: 'Mayor progreso' },
  { value: 'progress-asc', label: 'Menor progreso' },
];

interface HeaderProps {
  stats: BackorderStats;
  searchText: string;
  setSearchText: (value: string) => void;
  setDateRange: (value: DateRangeValue) => void;
  sortBy: BackorderSort;
  setSortBy: (value: BackorderSort) => void;
  statusFilter: BackorderStatusFilter;
  setStatusFilter: (value: BackorderStatusFilter) => void;
  onExport: () => void;
  exportDisabled?: boolean;
}

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'reserved', label: 'Reservados' },
] as const;

const Header = ({
  stats,
  searchText,
  setSearchText,
  setDateRange,
  sortBy,
  setSortBy,
  statusFilter,
  setStatusFilter,
  onExport,
  exportDisabled,
}: HeaderProps) => {
  const statItems = [
    { tone: 'total', label: 'Total', value: stats.total },
    { tone: 'pending', label: 'Pendientes', value: stats.pending },
    { tone: 'reserved', label: 'Reservados', value: stats.reserved },
  ] as const;

  return (
    <HeaderContainer>
      <HeaderStats>
        {statItems.map((item) => (
          <StatBox key={item.tone} $tone={item.tone}>
            <StatValue>{item.value}</StatValue>
            <StatLabel>{item.label}</StatLabel>
          </StatBox>
        ))}
      </HeaderStats>

      <FiltersWrapper>
        <FilterField>
          <Label>Buscar</Label>
          <SearchInput
            placeholder="Producto"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </FilterField>

        <FilterField>
          <Label>Fecha</Label>
          <RangeInput onChange={setDateRange} placeholder={['Inicio', 'Fin']} />
        </FilterField>

        <FilterField>
          <Label>Estado</Label>
          <SelectControl>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Estado"
            >
              {statusOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </SelectControl>
        </FilterField>

        <FilterField>
          <Label>Ordenar por</Label>
          <SelectControl>
            <Select
              value={sortBy}
              onChange={setSortBy}
              placeholder="Ordenar por"
              suffixIcon={<SortAscendingOutlined />}
            >
              {sortOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </SelectControl>
        </FilterField>

        <ExportAction>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            disabled={exportDisabled}
            onClick={onExport}
          >
            Exportar Excel
          </Button>
        </ExportAction>
      </FiltersWrapper>
    </HeaderContainer>
  );
};

export default Header;
