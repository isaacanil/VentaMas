import {
  faChevronLeft,
  faChevronRight,
  faFilter,
  faSearch,
  faStoreAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Input } from 'antd';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';
import { selectAuthReady, selectUser } from '@/features/auth/userSlice';
import { BusinessEditModal } from '@/modules/controlPanel/BusinessEditModal/BusinessEditModal';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { hasDeveloperAccess } from '@/utils/access/developerAccess';

import { BusinessCard } from './components/BusinessCard/BusinessCard';
import FiltersDrawer from './components/FiltersDrawer/FiltersDrawer';
import { useBusinessFeed } from './hooks/useBusinessFeed';
import { useBusinessControlUiState } from './hooks/useBusinessControlUiState';
import {
  collectSortedBusinessFieldValues,
  DEV_ONLY_ERROR,
  EMPTY_BUSINESSES,
  filterBusinesses,
  getBusinessHealthStats,
  hasAnyBusinessFilterApplied,
  paginateBusinesses,
  sortBusinesses,
} from './utils/businessControl';

export const BusinessControl: React.FC = () => {
  const authUser = useSelector(selectUser) as
    | { role?: string | null; uid?: string | null }
    | null;
  const authReady = useSelector(selectAuthReady);
  const isDeveloper = hasDeveloperAccess(authUser);
  const {
    closeFiltersDrawer,
    currentPage,
    debouncedSearchTerm,
    editModalOpen,
    filters,
    filtersVisible,
    goToNextPage,
    goToPrevPage,
    handleCloseModal,
    handleEditBusiness,
    handleFilterChange,
    resetFilters,
    searchTerm,
    selectedBusiness,
    setSearchTerm,
    showFiltersDrawer,
  } = useBusinessControlUiState();

  const itemsPerPage = 20;
  const businessFeedKey = authReady && isDeveloper ? authUser?.uid ?? 'developer' : null;
  const businessFeed = useBusinessFeed(businessFeedKey);

  const hasResolvedBusinessFeed =
    businessFeedKey !== null && businessFeed.resolvedKey === businessFeedKey;
  const businesses =
    authReady && isDeveloper && hasResolvedBusinessFeed
      ? businessFeed.items
      : EMPTY_BUSINESSES;
  const isLoading = !authReady || (businessFeedKey !== null && !hasResolvedBusinessFeed);
  const error = !authReady
    ? null
    : !isDeveloper
      ? DEV_ONLY_ERROR
      : hasResolvedBusinessFeed
        ? businessFeed.error
        : null;
  const availableProvinces = useMemo(
    () => collectSortedBusinessFieldValues(businesses, (item) => item.business.province),
    [businesses],
  );
  const availableCountries = useMemo(
    () => collectSortedBusinessFieldValues(businesses, (item) => item.business.country),
    [businesses],
  );
  const availableBusinessTypes = useMemo(
    () =>
      collectSortedBusinessFieldValues(businesses, (item) => item.business.businessType),
    [businesses],
  );
  const availableSubscriptionStatuses = useMemo(
    () =>
      collectSortedBusinessFieldValues(
        businesses,
        (item) => item.business.subscriptionStatus,
      ),
    [businesses],
  );
  const filteredBusinesses = useMemo(
    () => filterBusinesses(businesses, debouncedSearchTerm, filters),
    [businesses, debouncedSearchTerm, filters],
  );
  const sortedBusinesses = useMemo(
    () => sortBusinesses(filteredBusinesses, filters.sortBy),
    [filteredBusinesses, filters.sortBy],
  );
  const healthStats = useMemo(
    () => getBusinessHealthStats(filteredBusinesses),
    [filteredBusinesses],
  );
  const { currentBusinesses, totalPages } = useMemo(
    () => paginateBusinesses(sortedBusinesses, currentPage, itemsPerPage),
    [currentPage, sortedBusinesses],
  );
  const hasAnyFilterApplied = useMemo(
    () => hasAnyBusinessFilterApplied(filters),
    [filters],
  );

  return (
    <Container>
      <Head>
        <MenuApp sectionName={'Gestionar Negocios'} />
        <SearchAndFilterContainer>
          <SearchInputWrapper>
            <Input
              placeholder="Buscar por nombre, ID, dirección, teléfono..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              prefix={<FontAwesomeIcon icon={faSearch} />}
            />
          </SearchInputWrapper>
          <Button
            icon={<FontAwesomeIcon icon={faFilter} />}
            onClick={showFiltersDrawer}
            type={filtersVisible ? 'primary' : 'default'}
          >
            Filtros {hasAnyFilterApplied ? `(${filteredBusinesses.length})` : ''}
          </Button>
        </SearchAndFilterContainer>
        <FiltersDrawer
          visible={filtersVisible}
          onClose={closeFiltersDrawer}
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={resetFilters}
          availableProvinces={availableProvinces}
          availableCountries={availableCountries}
          availableBusinessTypes={availableBusinessTypes}
          availableSubscriptionStatuses={availableSubscriptionStatuses}
          resultsCount={filteredBusinesses.length}
        />
        <StatsStrip>
          <StatChip>Total: {healthStats.total}</StatChip>
          <StatChip $tone="ok">Con dueño: {healthStats.withOwner}</StatChip>
          <StatChip $tone="danger">Sin dueño: {healthStats.missingOwner}</StatChip>
          <StatChip>Con suscripción: {healthStats.withSubscription}</StatChip>
          <StatChip $tone="ok">
            Suscripción activa/prueba: {healthStats.activeSubscription}
          </StatChip>
        </StatsStrip>
      </Head>
      <Body>
        {error && businesses.length > 0 && (
          <ErrorBanner>{error}</ErrorBanner>
        )}
        {isLoading ? (
          <LoadingMessage>
            <FontAwesomeIcon icon={faStoreAlt} spin /> Cargando negocios...
          </LoadingMessage>
        ) : error && businesses.length === 0 ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : currentBusinesses.length === 0 ? (
          <EmptyMessage>
            {debouncedSearchTerm || hasAnyFilterApplied ? (
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
          currentBusinesses.map((item) => {
            return (
              <BusinessCard
                key={item.id}
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
          onClick={() => goToNextPage(totalPages)}
          disabled={currentPage >= totalPages}
        />
      </Pagination>
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

const Container = styled(PageShell)`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
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

const StatsStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 10px 10px;
`;

const StatChip = styled.span<{ $tone?: 'ok' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $tone }) =>
    $tone === 'ok' ? '#166534' : $tone === 'danger' ? '#9f1239' : '#334155'};
  background: ${({ $tone }) =>
    $tone === 'ok'
      ? '#dcfce7'
      : $tone === 'danger'
        ? '#ffe4e6'
        : 'rgb(148 163 184 / 15%)'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'ok'
        ? 'rgb(22 163 74 / 35%)'
        : $tone === 'danger'
          ? 'rgb(225 29 72 / 35%)'
          : 'rgb(148 163 184 / 35%)'};
  border-radius: 999px;
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

const ErrorBanner = styled.div`
  grid-column: 1 / -1;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #ff4d4f;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  text-align: center;
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
