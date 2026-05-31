import {
  faCalendarAlt,
  faFileInvoiceDollar,
  faFilter,
  faGlobe,
  faMapMarkerAlt,
  faSortAmountDown,
  faSortAmountUp,
  faStoreAlt,
  faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Drawer, Select, Typography } from 'antd';
import React from 'react';

import {
  DrawerFooter,
  DrawerTitle,
  FilterControl,
  FilterLabel,
  FiltersSpace,
  LabelIcon,
  SortOption,
  TitleIcon,
} from './FiltersDrawer.styles';

type SortBy = 'newest' | 'oldest';
type OwnerStateFilter = 'all' | 'with_owner' | 'without_owner';

interface BusinessFilters {
  province: string;
  country: string;
  businessType: string;
  hasRNC: boolean;
  sortBy: SortBy;
  ownerState: OwnerStateFilter;
  subscriptionStatus: string;
}

interface FiltersDrawerProps {
  visible: boolean;
  onClose: () => void;
  filters: BusinessFilters;
  handleFilterChange: (
    filterName: keyof BusinessFilters,
    value: BusinessFilters[keyof BusinessFilters],
  ) => void;
  resetFilters: () => void;
  availableProvinces: string[];
  availableCountries: string[];
  availableBusinessTypes: string[];
  availableSubscriptionStatuses: string[];
  resultsCount: number;
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  active: 'Activa',
  trialing: 'En prueba',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  paused: 'Pausada',
  unpaid: 'Sin pago',
};

const getSubscriptionStatusLabel = (status: string): string => {
  return SUBSCRIPTION_LABELS[status] || status;
};

const FiltersDrawer: React.FC<FiltersDrawerProps> = ({
  visible,
  onClose,
  filters,
  handleFilterChange,
  resetFilters,
  availableProvinces,
  availableCountries,
  availableBusinessTypes,
  availableSubscriptionStatuses,
  resultsCount,
}) => {
  return (
    <Drawer
      title={
        <DrawerTitle>
          <TitleIcon icon={faFilter} />
          <span>Filtros y Ordenamiento</span>
        </DrawerTitle>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={360}
      footer={
        <DrawerFooter>
          <Typography.Text>
            {resultsCount}{' '}
            {resultsCount === 1 ? 'negocio encontrado' : 'negocios encontrados'}
          </Typography.Text>
          <Button onClick={resetFilters}>Limpiar Filtros</Button>
        </DrawerFooter>
      }
    >
      <FiltersSpace orientation="vertical" size="large">
        <FilterControl>
          <FilterLabel>
            <LabelIcon icon={faMapMarkerAlt} />
            Provincia
          </FilterLabel>
          <Select
            placeholder="Seleccionar provincia"
            value={filters.province}
            onChange={(value: string | undefined) =>
              handleFilterChange('province', value ?? '')
            }
            allowClear
            options={availableProvinces.map((province) => ({
              value: province,
              label: province,
            }))}
          />
        </FilterControl>

        <FilterControl>
          <FilterLabel>
            <LabelIcon icon={faGlobe} />
            Pais
          </FilterLabel>
          <Select
            placeholder="Seleccionar pais"
            value={filters.country}
            onChange={(value: string | undefined) =>
              handleFilterChange('country', value ?? '')
            }
            allowClear
            options={availableCountries.map((country) => ({
              value: country,
              label:
                country === 'do'
                  ? 'Republica Dominicana'
                  : country === 'co'
                    ? 'Colombia'
                    : country === 'us'
                      ? 'Estados Unidos'
                      : country,
            }))}
          />
        </FilterControl>

        <FilterControl>
          <FilterLabel>
            <LabelIcon icon={faStoreAlt} />
            Tipo de Negocio
          </FilterLabel>
          <Select
            placeholder="Seleccionar tipo"
            value={filters.businessType}
            onChange={(value: string | undefined) =>
              handleFilterChange('businessType', value ?? '')
            }
            allowClear
            options={availableBusinessTypes.map((type) => ({
              value: type,
              label:
                type === 'general'
                  ? 'General'
                  : type === 'pharmacy'
                    ? 'Farmacia'
                    : type === 'restaurant'
                      ? 'Restaurante'
                      : type,
            }))}
          />
        </FilterControl>

        <FilterControl>
          <FilterLabel>
            <LabelIcon icon={faUserShield} />
            Propietario
          </FilterLabel>
          <Select
            value={filters.ownerState}
            onChange={(value: OwnerStateFilter) =>
              handleFilterChange('ownerState', value)
            }
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'with_owner', label: 'Con dueno' },
              { value: 'without_owner', label: 'Sin dueno' },
            ]}
          />
        </FilterControl>

        <FilterControl>
          <FilterLabel>
            <LabelIcon icon={faFileInvoiceDollar} />
            Estado de Suscripcion
          </FilterLabel>
          <Select
            placeholder="Todos los estados"
            value={filters.subscriptionStatus || undefined}
            onChange={(value: string | undefined) =>
              handleFilterChange('subscriptionStatus', value ?? '')
            }
            allowClear
            options={availableSubscriptionStatuses.map((status) => ({
              value: status,
              label: getSubscriptionStatusLabel(status),
            }))}
          />
        </FilterControl>

        <FilterControl>
          <FilterLabel>
            <LabelIcon icon={faCalendarAlt} />
            Ordenar por Fecha de Creacion
          </FilterLabel>
          <Select
            value={filters.sortBy}
            onChange={(value: SortBy) => handleFilterChange('sortBy', value)}
            options={[
              {
                value: 'newest',
                label: (
                  <SortOption>
                    <FontAwesomeIcon icon={faSortAmountDown} />
                    <span>Mas recientes primero</span>
                  </SortOption>
                ),
              },
              {
                value: 'oldest',
                label: (
                  <SortOption>
                    <FontAwesomeIcon icon={faSortAmountUp} />
                    <span>Mas antiguos primero</span>
                  </SortOption>
                ),
              },
            ]}
          />
        </FilterControl>
      </FiltersSpace>
    </Drawer>
  );
};

export default FiltersDrawer;
