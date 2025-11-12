import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Pagination, Select, Spin, message, Modal } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import { DatePicker } from '../../../../../components/common/DatePicker/DatePicker';
import { selectUser } from '../../../../../features/auth/userSlice';

import { DetailModal } from './components/DetailModal';
import { RequestCard } from './components/RequestCard';
import { ITEMS_PER_PAGE } from './constants/constants';
import {
  useAuthorizationRequests,
  type StatusFilterValue,
} from './hooks/useAuthorizationRequests';

import type { AppUser, AuthorizationRequestListItem } from './types';
import type { SelectProps } from 'antd';

interface AuthorizationRequestsProps {
  searchTerm?: string;
}

const STATUS_VALUES: StatusFilterValue[] = [
  'pending',
  'completed',
  'approved',
  'rejected',
  'used',
  'expired',
  'all',
];

const STATUS_LABELS: Record<StatusFilterValue, string> = {
  pending: 'Pendientes',
  completed: 'Completadas',
  approved: 'Aprobadas',
  rejected: 'Rechazadas',
  used: 'Usadas',
  expired: 'Expiradas',
  all: 'Todas',
};

const STATUS_OPTIONS: SelectProps<StatusFilterValue>['options'] =
  STATUS_VALUES.map((value) => ({
    value,
    label: STATUS_LABELS[value],
  }));

const STATUS_VALUE_SET = new Set<StatusFilterValue>(STATUS_VALUES);
const DEFAULT_STATUS: StatusFilterValue = 'pending';

const isAppUser = (value: unknown): value is AppUser =>
  typeof value === 'object' && value !== null;

export const AuthorizationRequests = ({
  searchTerm = '',
}: AuthorizationRequestsProps) => {
  const rawUser: unknown = useSelector(selectUser);
  const user = isAppUser(rawUser) ? rawUser : null;
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const normalizedStatusParam =
    statusParam && STATUS_VALUE_SET.has(statusParam as StatusFilterValue)
      ? (statusParam as StatusFilterValue)
      : null;
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const {
    loading,
    statusFilter,
    setStatusFilter,
    detailRequest,
    currentPage,
    setCurrentPage,
    load,
    performApproval,
    handleApprove,
    handleReject,
    handleViewDetails,
    closeDetailModal,
    filteredRequests,
  } = useAuthorizationRequests(user, searchTerm, dateRange);

  useEffect(() => {
    if (normalizedStatusParam && normalizedStatusParam !== statusFilter) {
      setStatusFilter(normalizedStatusParam);
    }
  }, [normalizedStatusParam, setStatusFilter, statusFilter]);

  useEffect(() => {
    if (!statusParam) {
      const params = new URLSearchParams(searchParams);
      params.set('status', DEFAULT_STATUS);
      setSearchParams(params, { replace: true });
      return;
    }

    if (statusParam && !normalizedStatusParam) {
      const params = new URLSearchParams(searchParams);
      params.set('status', DEFAULT_STATUS);
      setSearchParams(params, { replace: true });
    }
  }, [normalizedStatusParam, searchParams, setSearchParams, statusParam]);

  const handleStatusChange = (value: StatusFilterValue) => {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParams);
    params.set('status', value);
    setSearchParams(params);
  };

  const handleDateRangeChange = (value: unknown) => {
    if (
      Array.isArray(value) &&
      typeof value[0] === 'string' &&
      typeof value[1] === 'string'
    ) {
      setDateRange([value[0], value[1]]);
      return;
    }

    setDateRange(null);
  };

  const APPROVER_ROLES = ['admin', 'owner', 'dev', 'manager'];

  const totalRequests = filteredRequests.length;
  const totalPages = Math.max(
    1,
    Math.ceil((totalRequests || 1) / ITEMS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage, setCurrentPage]);

  const paginatedRequests = useMemo<AuthorizationRequestListItem[]>(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const shouldShowPagination = totalRequests > ITEMS_PER_PAGE;

  const onApprove = (id: string) => {
    if (!user) {
      message.warning('Debes iniciar sesión para aprobar solicitudes.');
      return;
    }

    if (user.role && !APPROVER_ROLES.includes(user.role)) {
      message.warning('No tienes permisos para aprobar esta solicitud.');
      return;
    }

    Modal.confirm({
      title: '¿Confirmar autorización?',
      content:
        'Esta acción aprobará la solicitud y quedará registrada en el historial.',
      okText: 'Autorizar',
      cancelText: 'Cancelar',
      onOk: async () => {
        const approvalId = handleApprove(id);
        if (approvalId) {
          await performApproval(approvalId, user);
        }
      },
    });
  };

  return (
    <>
      <Container>
        <FilterBar>
          <FilterSection>
            <FilterGroup>
              <FilterLabel>Estado:</FilterLabel>
              <Select<StatusFilterValue>
                value={statusFilter}
                style={{ width: 200 }}
                onChange={handleStatusChange}
                options={STATUS_OPTIONS}
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Fecha:</FilterLabel>
              <DatePicker
                mode="range"
                value={dateRange}
                onChange={handleDateRangeChange}
                placeholder="Seleccionar rango de fechas"
                allowClear
                className=""
                style={{ width: 260 }}
              />
            </FilterGroup>
          </FilterSection>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              void load();
            }}
            loading={loading}
          >
            Actualizar
          </Button>
        </FilterBar>

        <CardsSection>
          <CardsSpin spinning={loading} tip="Cargando...">
            <CardsContent>
              {paginatedRequests.length === 0 && !loading ? (
                <EmptyState>
                  {searchTerm
                    ? 'No se encontraron solicitudes que coincidan con la búsqueda.'
                    : 'No hay solicitudes para mostrar.'}
                </EmptyState>
              ) : (
                <CardsGrid>
                  {paginatedRequests.map((item) => (
                    <RequestCard
                      key={item.key}
                      item={item}
                      onApprove={onApprove}
                      onReject={handleReject}
                      onOpenDetails={handleViewDetails}
                    />
                  ))}
                </CardsGrid>
              )}
            </CardsContent>
          </CardsSpin>

          {shouldShowPagination && (
            <PaginationWrapper>
              <Pagination
                current={currentPage}
                pageSize={ITEMS_PER_PAGE}
                total={totalRequests}
                onChange={setCurrentPage}
                showSizeChanger={false}
              />
            </PaginationWrapper>
          )}
        </CardsSection>
      </Container>

      <DetailModal
        open={!!detailRequest}
        detailRequest={detailRequest}
        onClose={closeDetailModal}
        onApprove={onApprove}
        onReject={handleReject}
      />
    </>
  );
};

const Container = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;

  .ant-card-body {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
  }
`;

const FilterBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;

    > * {
      width: 100% !important;
    }
  }
`;

const FilterLabel = styled.span`
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
`;

const CardsSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 16px;
  overflow: hidden;
`;

const CardsSpin = styled(Spin)`
  width: 100%;
  display: flex;
  flex: 1;

  .ant-spin-container {
    display: flex;
    flex: 1;
  }
`;

const CardsContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 16px;
  color: rgba(0, 0, 0, 0.45);
  border: 1px dashed #d9d9d9;
  border-radius: 12px;
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding-bottom: 4px;
`;
