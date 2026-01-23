import {
  faChevronLeft,
  faChevronRight,
  faFilter,
  faSearch,
  faStoreAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input, Button } from 'antd';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { fbGetBusinesses } from '@/firebase/dev/businesses/fbGetBusinesses';
import { BusinessEditModal } from '@/modules/controlPanel/BusinessEditModal/BusinessEditModal';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { BusinessCard } from './components/BusinessCard/BusinessCard';
import FiltersDrawer from './components/FiltersDrawer/FiltersDrawer';

interface BusinessTimestamp {
  seconds?: number;
}

interface BusinessInfo {
  id?: string;
  name?: string;
  address?: string;
  tel?: string;
  email?: string;
  rnc?: string;
  province?: string;
  country?: string;
  businessType?: string;
  createdAt?: BusinessTimestamp;
}

interface BusinessDoc {
  business?: BusinessInfo;
}

type SortBy = 'newest' | 'oldest';

interface BusinessFilters {
  province: string;
  country: string;
  businessType: string;
  hasRNC: boolean;
  sortBy: SortBy;
}

export const BusinessControl: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessDoc[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BusinessFilters>({
    province: '',
    country: '',
    businessType: '',
    hasRNC: false,
    sortBy: 'newest', // Opciones: newest, oldest
  });
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableBusinessTypes, setAvailableBusinessTypes] = useState<string[]>(
    [],
  );
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fbGetBusinesses(setBusinesses);
      } catch (err: unknown) {
        console.error('Error al cargar los negocios:', err);
        setError(
          'No se pudieron cargar los negocios. Por favor, intente de nuevo más tarde.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  // Extraer opciones disponibles de filtros de los datos de negocios
  useEffect(() => {
    if (businesses && businesses.length) {
      // Extraer provincias únicas
      const provinces = [
        ...new Set(
          businesses.map((item) => item.business?.province).filter(Boolean),
        ),
      ].sort();
      setAvailableProvinces(provinces);

      // Extraer países únicos
      const countries = [
        ...new Set(
          businesses.map((item) => item.business?.country).filter(Boolean),
        ),
      ].sort();
      setAvailableCountries(countries);

      // Extraer tipos de negocio únicos
      const businessTypes = [
        ...new Set(
          businesses.map((item) => item.business?.businessType).filter(Boolean),
        ),
      ].sort();
      setAvailableBusinessTypes(businessTypes);
    }
  }, [businesses]);

  // Implementación de debounce para la búsqueda
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms de retraso

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const handleFilterChange = (
    filterName: keyof BusinessFilters,
    value: BusinessFilters[keyof BusinessFilters],
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    // Regresar a la primera página al cambiar filtros
    setCurrentPage(1);
  };
  const resetFilters = () => {
    setFilters({
      province: '',
      country: '',
      businessType: '',
      hasRNC: false,
      sortBy: 'newest',
    });
  };
  const showFiltersDrawer = () => {
    setFiltersVisible(true);
  };

  const closeFiltersDrawer = () => {
    setFiltersVisible(false);
  };

  const filteredBusinesses = businesses.filter((obj) => {
    const business: BusinessInfo = obj.business ?? {};

    // Filtro por término de búsqueda (nombre, dirección, teléfono, email, etc.)
    const searchMatches =
      !debouncedSearchTerm ||
      (business.name &&
        business.name
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())) ||
      (business.address &&
        business.address
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())) ||
      (business.tel &&
        business.tel
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())) ||
      (business.email &&
        business.email
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase())) ||
      (business.rnc &&
        business.rnc.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

    // Filtro por provincia
    const provinceMatches =
      !filters.province ||
      (business.province && business.province === filters.province);

    // Filtro por país
    const countryMatches =
      !filters.country ||
      (business.country && business.country === filters.country);

    // Filtro por tipo de negocio
    const businessTypeMatches =
      !filters.businessType ||
      (business.businessType && business.businessType === filters.businessType);

    // Filtro por RNC (si existe o no)
    const rncMatches =
      !filters.hasRNC || (business.rnc && business.rnc.trim() !== '');

    // Debe cumplir con todos los filtros
    return (
      searchMatches &&
      provinceMatches &&
      countryMatches &&
      businessTypeMatches &&
      rncMatches
    );
  });
  // Ordenar negocios por fecha de creación
  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    const dateA = a.business?.createdAt?.seconds || 0;
    const dateB = b.business?.createdAt?.seconds || 0;

    // Ordenar por más reciente (newest) o más antiguo (oldest)
    return filters.sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const indexOfLastBusiness = currentPage * itemsPerPage;
  const indexOfFirstBusiness = indexOfLastBusiness - itemsPerPage;
  const currentBusinesses = sortedBusinesses.slice(
    indexOfFirstBusiness,
    indexOfLastBusiness,
  );
  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleEditBusiness = (business: BusinessInfo) => {
    setSelectedBusiness(business);
    setEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setSelectedBusiness(null);
  };
  return (
    <Container>
      <Head>
        <MenuApp sectionName={'Gestionar Negocios'} />{' '}
        <SearchAndFilterContainer>
          <SearchInputWrapper>
            <Input
              placeholder="Buscar por nombre, dirección, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<FontAwesomeIcon icon={faSearch} />}
            />
          </SearchInputWrapper>{' '}
          <Button
            icon={<FontAwesomeIcon icon={faFilter} />}
            onClick={showFiltersDrawer}
            type={filtersVisible ? 'primary' : 'default'}
          >
            Filtros{' '}
            {filters.province || filters.country || filters.businessType
              ? `(${filteredBusinesses.length})`
              : ''}
          </Button>
        </SearchAndFilterContainer>
        {/* Implementación del drawer de filtros */}
        <FiltersDrawer
          visible={filtersVisible}
          onClose={closeFiltersDrawer}
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={resetFilters}
          availableProvinces={availableProvinces}
          availableCountries={availableCountries}
          availableBusinessTypes={availableBusinessTypes}
          resultsCount={filteredBusinesses.length}
        />
      </Head>{' '}
      <Body>
        {isLoading ? (
          <LoadingMessage>
            <FontAwesomeIcon icon={faStoreAlt} spin /> Cargando negocios...
          </LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : currentBusinesses.length === 0 ? (
          <EmptyMessage>
            {debouncedSearchTerm ||
            filters.province ||
            filters.country ||
            filters.businessType ||
            filters.hasRNC ? (
              <>
                <FontAwesomeIcon
                  icon={faFilter}
                  style={{
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    opacity: 0.5,
                  }}
                />
                <p>No se encontraron negocios con los filtros aplicados.</p>
                <Button onClick={resetFilters}>Limpiar filtros</Button>
              </>
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faStoreAlt}
                  style={{
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    opacity: 0.5,
                  }}
                />
                <p>No hay negocios registrados.</p>
              </>
            )}
          </EmptyMessage>
        ) : (
          currentBusinesses.map((item, idx) => {
            if (!item.business) {
              return null;
            }

            return (
              <BusinessCard
                key={idx}
                business={item.business}
                onEditBusiness={handleEditBusiness}
              />
            );
          })
        )}
      </Body>
      <Pagination>
        <Button
          shape="circle"
          icon={<FontAwesomeIcon icon={faChevronLeft} />}
          onClick={goToPrevPage}
          disabled={currentPage === 1}
        />
        <PageIndicator>
          {currentPage}/{totalPages}
        </PageIndicator>
        <Button
          shape="circle"
          icon={<FontAwesomeIcon icon={faChevronRight} />}
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
        />
      </Pagination>
      {/* Modal centralizado para editar negocio */}
      {selectedBusiness && (
        <BusinessEditModal
          isOpen={editModalOpen}
          onClose={handleCloseModal}
          business={selectedBusiness}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  height: 100vh;
  overflow: hidden;
`;
const Head = styled.div``;

const SearchAndFilterContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
`;

const SearchInputWrapper = styled.div`
  width: 300px;
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
  align-content: start;
  padding: 10px;
  overflow: auto;
  background-color: var(--color2);
`;
const Pagination = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: center;
  padding: 10px;
`;

const PageIndicator = styled.div`
  min-width: 40px;
  font-size: 14px;
  font-weight: 500;
  color: #595959;
  text-align: center;
`;

const LoadingMessage = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: 1 / -1;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  font-size: 1rem;
  color: #595959;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  font-size: 1rem;
  color: #ff4d4f;
  text-align: center;
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #595959;
  text-align: center;

  p {
    margin-bottom: 1rem;
    font-size: 1rem;
  }
`;

