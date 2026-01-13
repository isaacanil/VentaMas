// @ts-nocheck
import {
  faFilter,
  faMapMarkerAlt,
  faGlobe,
  faStoreAlt,
  faCalendarAlt,
  faSortAmountDown,
  faSortAmountUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Drawer, Space, Select, Button, Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';

const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #595959;
`;

const FiltersDrawer = ({
  visible,
  onClose,
  filters,
  handleFilterChange,
  resetFilters,
  availableProvinces,
  availableCountries,
  availableBusinessTypes,
  resultsCount,
}) => {
  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FontAwesomeIcon icon={faFilter} style={{ color: '#1890ff' }} />
          <span>Filtros y Ordenamiento</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={360}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography.Text>
            {resultsCount}{' '}
            {resultsCount === 1 ? 'negocio encontrado' : 'negocios encontrados'}
          </Typography.Text>
          <Button onClick={resetFilters}>Limpiar Filtros</Button>
        </div>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <FilterLabel>
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              style={{ marginRight: '8px' }}
            />
            Provincia
          </FilterLabel>
          <Select
            style={{ width: '100%' }}
            placeholder="Seleccionar provincia"
            value={filters.province}
            onChange={(value) => handleFilterChange('province', value)}
            allowClear
          >
            {availableProvinces.map((province) => (
              <Select.Option key={province} value={province}>
                {province}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <FilterLabel>
            <FontAwesomeIcon icon={faGlobe} style={{ marginRight: '8px' }} />
            País
          </FilterLabel>
          <Select
            style={{ width: '100%' }}
            placeholder="Seleccionar país"
            value={filters.country}
            onChange={(value) => handleFilterChange('country', value)}
            allowClear
          >
            {availableCountries.map((country) => (
              <Select.Option key={country} value={country}>
                {country === 'do'
                  ? 'República Dominicana'
                  : country === 'co'
                    ? 'Colombia'
                    : country === 'us'
                      ? 'Estados Unidos'
                      : country}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <FilterLabel>
            <FontAwesomeIcon icon={faStoreAlt} style={{ marginRight: '8px' }} />
            Tipo de Negocio
          </FilterLabel>
          <Select
            style={{ width: '100%' }}
            placeholder="Seleccionar tipo"
            value={filters.businessType}
            onChange={(value) => handleFilterChange('businessType', value)}
            allowClear
          >
            {availableBusinessTypes.map((type) => (
              <Select.Option key={type} value={type}>
                {type === 'general'
                  ? 'General'
                  : type === 'pharmacy'
                    ? 'Farmacia'
                    : type === 'restaurant'
                      ? 'Restaurante'
                      : type}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <FilterLabel>
            <FontAwesomeIcon
              icon={faCalendarAlt}
              style={{ marginRight: '8px' }}
            />
            Ordenar por Fecha de Creación
          </FilterLabel>
          <Select
            style={{ width: '100%' }}
            value={filters.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
          >
            <Select.Option value="newest">
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FontAwesomeIcon icon={faSortAmountDown} />
                <span>Más recientes primero</span>
              </div>
            </Select.Option>
            <Select.Option value="oldest">
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FontAwesomeIcon icon={faSortAmountUp} />
                <span>Más antiguos primero</span>
              </div>
            </Select.Option>
          </Select>
        </div>
      </Space>
    </Drawer>
  );
};

export default FiltersDrawer;
