import { Select, DatePicker, Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';
import type { Dayjs } from 'dayjs';

import type { InsuranceOption } from '../../../types';

const { Text } = Typography;
const { Option } = Select;

/**
 * Barra de filtros para el modal de pago múltiple
 * @param {Object} props - Propiedades del componente
 * @param {string} props.insuranceFilter - Filtro de aseguradora seleccionado
 * @param {Array} props.insuranceOptions - Opciones de aseguradoras disponibles
 * @param {Function} props.onInsuranceFilterChange - Función para manejar cambio de filtro de aseguradora
 * @param {Function} props.onDateRangeChange - Función para manejar cambio de rango de fechas
 */
type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

interface FilterBarProps {
  insuranceFilter: string;
  insuranceOptions: InsuranceOption[];
  onInsuranceFilterChange: (value: string) => void;
  onDateRangeChange: (value: DateRangeValue) => void;
}

const FilterBar = ({
  insuranceFilter,
  insuranceOptions,
  onInsuranceFilterChange,
  onDateRangeChange,
}: FilterBarProps) => {
  return (
    <FilterRow>
      <FilterGroup>
        <Text strong style={{ marginRight: '8px' }}>
          Aseguradora:
        </Text>
        <Select
          style={{ width: '200px' }}
          value={insuranceFilter}
          onChange={onInsuranceFilterChange}
          placeholder="Seleccionar aseguradora"
        >
          {insuranceOptions.map((option) => (
            <Option key={option.id} value={option.id}>
              {option.name}
            </Option>
          ))}
        </Select>
      </FilterGroup>

      <FilterGroup>
        <Text strong style={{ marginRight: '8px' }}>
          Fecha:
        </Text>
        <DatePicker.RangePicker
          style={{ width: '280px' }}
          onChange={onDateRangeChange}
          format="DD/MM/YYYY"
        />
      </FilterGroup>
    </FilterRow>
  );
};

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
`;

export default FilterBar;
