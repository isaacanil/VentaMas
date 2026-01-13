import {
  SearchOutlined,
  SortAscendingOutlined,
  DownloadOutlined,
} from '@/constants/icons/antd';
import { Input, DatePicker, Select, Button } from 'antd';
import styled from 'styled-components';

import type {
  BackorderSort,
  BackorderStats,
  BackorderStatusFilter,
  DateRangeValue,
} from '../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const HeaderContainer = styled.div`
  margin-bottom: 24px;
`;

const HeaderStats = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const StatBox = styled.div`
  min-width: 80px;
  padding: 6px 12px;
  border-radius: 4px;

  &.total {
    background: #fafafa;
    border: 1px solid #f0f0f0;
  }

  &.pending {
    background: #fff7e6;
    border: 1px solid #ffd591;
  }

  &.reserved {
    background: #e6f7ff;
    border: 1px solid #91d5ff;
  }
`;

const FiltersWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
`;

const FilterField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
`;

const Label = styled.span`
  font-size: 11px;
  color: #8c8c8c;
`;

const sortOptions = [
  { value: 'name-asc', label: 'Nombre (A–Z)' },
  { value: 'name-desc', label: 'Nombre (Z–A)' },
  { value: 'pending-desc', label: 'Mayor cantidad pendiente' },
  { value: 'pending-asc', label: 'Menor cantidad pendiente' },
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'date-asc', label: 'Más antiguos' },
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
  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'reserved', label: 'Reservados' },
  ];
  return (
    <HeaderContainer>
      <HeaderStats>
        <StatBox className="total">
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>Total</div>
        </StatBox>
        <StatBox className="pending">
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>Pendientes</div>
        </StatBox>
        <StatBox className="reserved">
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            {stats.reserved}
          </div>
          <div style={{ fontSize: '11px', color: '#8c8c8c' }}>Reservados</div>
        </StatBox>
      </HeaderStats>

      <FiltersWrapper>
        <FilterField>
          <Label>Buscar</Label>
          <Input
            placeholder="Producto"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '180px' }}
          />
        </FilterField>

        <FilterField>
          <Label>Fecha</Label>
          <RangePicker
            onChange={setDateRange}
            placeholder={['Inicio', 'Fin']}
            style={{ width: 'auto' }}
          />
        </FilterField>

        <FilterField>
          <Label>Estado</Label>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: '160px' }}
            placeholder="Estado"
          >
            {statusOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </FilterField>

        <FilterField>
          <Label>Ordenar por</Label>
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: '160px' }}
            placeholder="Ordenar por"
            suffixIcon={<SortAscendingOutlined />}
          >
            {sortOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </FilterField>

        <div style={{ marginLeft: 'auto' }}>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            disabled={exportDisabled}
            onClick={onExport}
          >
            Exportar Excel
          </Button>
        </div>
      </FiltersWrapper>
    </HeaderContainer>
  );
};

export default Header;
