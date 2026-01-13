// @ts-nocheck
import { ReloadOutlined } from '@/constants/icons/antd';
import { Button, Card, Pagination, Select, Spin, message, Modal } from 'antd';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import { DatePicker } from '@/components/common/DatePicker/DatePicker';
import { selectUser } from '@/features/auth/userSlice';

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
      DateTime.isDateTime(value[0]) &&
      DateTime.isDateTime(value[1])
    ) {
      setDateRange([value[0].toISO(), value[1].toISO()]);
      return;
    }

    setDateRange(null);
  };

  const pickerValue = useMemo(() => {
    if (!dateRange?.[0] || !dateRange?.[1]) return null;
    const start = DateTime.fromISO(dateRange[0]);
    const end = DateTime.fromISO(dateRange[1]);
    return start.isValid && end.isValid ? [start, end] : null;
  }, [dateRange]);

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
      title: 'Ã‚¿Confirmar autorización?',
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
                value={pickerValue}
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
  display: flex;
  flex-direction: column;
  height: 100%;

  .ant-card-body {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
  }
`;

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;

  @media (width <= 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;

  @media (width <= 768px) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (width <= 768px) {
    flex-direction: column;
    align-items: stretch;

    > * {
      width: 100% !important;
    }
  }
`;

const FilterLabel = styled.span`
  font-weight: 500;
  color: rgb(0 0 0 / 85%);
`;

const CardsSection = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
`;

const CardsSpin = styled(Spin)`
  display: flex;
  flex: 1;
  width: 100%;

  .ant-spin-container {
    display: flex;
    flex: 1;
  }
`;

const CardsContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const EmptyState = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: rgb(0 0 0 / 45%);
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 12px;
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding-bottom: 4px;
`;
