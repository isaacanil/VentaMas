import { ReloadOutlined } from '@ant-design/icons';
import { Select, Button, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';


// @ts-ignore - legacy JS component without type declarations
import { DatePicker as CommonDatePicker } from '../../../../../components/common/DatePicker';
import { selectUser } from '../../../../../features/auth/userSlice';
import { fbListApprovalLogs } from '../../../../../firebase/authorization/approvalLogs';
import { getDateRange } from '../../../../../utils/date/getDateRange';

import type { Dayjs } from 'dayjs';

interface UserSnapshot {
  uid?: string;
  name?: string;
  role?: string;
  email?: string;
}

interface TargetSnapshot {
  type?: string;
  id?: string;
  name?: string;
  details?: Record<string, unknown> | null;
}

interface ApprovalLogEntry {
  id: string;
  module: string;
  action: string;
  description: string;
  requestedBy: UserSnapshot | null;
  authorizer: UserSnapshot | null;
  targetUser: UserSnapshot | null;
  target: TargetSnapshot | null;
  metadata: Record<string, unknown> | null;
  sameUser: boolean;
  createdAt: Date | null;
}

interface ApprovalLogsProps {
  searchTerm?: string;
}

type RangeValue = [Dayjs | null, Dayjs | null];

const Wrapper = styled.div`
  display: grid;
  gap: 16px;
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
`;

const TableContainer = styled.div`
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden;
`;

const TableElement = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 960px;
`;

const TableHeadCell = styled.th`
  background: #f7f9fc;
  color: #1f2937;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #f0f2f5;

  &:hover {
    background: #f5f7ff;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 13px;
  vertical-align: top;
  color: #374151;
`;

const Text = styled.span`
  font-size: 13px;
  color: #1f2937;
`;

const TagPill = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  background: ${({ $color }) => `${$color}1a`};
  color: ${({ $color }) => $color};
  margin-right: 6px;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 26px;
  height: 26px;
  border: 3px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const EmptyState = styled.div`
  padding: 48px 24px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
`;

const ErrorBanner = styled.div`
  padding: 12px 16px;
  border-radius: 10px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 13px;
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 16px;
`;

const PaginationButton = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #1f2937;
  font-size: 12px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    border-color: #2563eb;
    color: #2563eb;
  }
`;

const PaginationInfo = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const MODULE_LABELS: Record<string, string> = {
  invoices: 'Facturación',
  accountsReceivable: 'Cuentas por cobrar',
  cashRegister: 'Cuadre de caja',
  authorizationRequests: 'Solicitudes',
};

const MODULE_COLORS: Record<string, string> = {
  invoices: '#2563eb',
  accountsReceivable: '#f97316',
  cashRegister: '#059669',
  authorizationRequests: '#8b5cf6',
  generic: '#6b7280',
};

const ACTION_LABELS: Record<string, string> = {
  'authorization-request-approve': 'Aprobada',
  'authorization-request-reject': 'Rechazada',
  'cash-register-opening': 'Apertura autorizada',
  'cash-register-closing': 'Cierre autorizado',
  'invoice-discount-override': 'Autorización de descuento',
  'invoice-edit-approve': 'Edición de factura autorizada',
  authorization: 'Autorizada',
};

const ACTION_COLORS: Record<string, string> = {
  'authorization-request-approve': '#0ea5e9',
  'authorization-request-reject': '#ef4444',
  'cash-register-opening': '#22c55e',
  'cash-register-closing': '#9333ea',
  'invoice-discount-override': '#22d3ee',
  'invoice-edit-approve': '#f59e0b',
  authorization: '#0ea5e9',
};

const TARGET_LABELS: Record<string, string> = {
  authorizationRequest: 'Solicitud',
  invoice: 'Factura',
  cashCount: 'Cuadre de caja',
  cart: 'Carrito',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  owner: 'Propietario',
  dev: 'Desarrollador',
  manager: 'Gerente',
  cashier: 'Cajero',
};

const isCashRegisterEntry = (entry: ApprovalLogEntry) => {
  const action = entry.action || '';
  const targetType = entry.target?.type || '';
  const metadataModule =
    entry.metadata && typeof entry.metadata === 'object' && typeof entry.metadata.module === 'string'
      ? entry.metadata.module
      : '';

  return action.startsWith('cash-register') || targetType === 'cashCount' || metadataModule === 'cashRegister';
};

const resolveName = (user?: UserSnapshot | null) =>
  user?.name || user?.email || user?.uid || '—';

const resolveUserSummary = (user?: UserSnapshot | null) => {
  if (!user) return '—';
  const roleLabel = user.role ? ROLE_LABELS[user.role] || user.role : '';
  return roleLabel ? `${resolveName(user)} (${roleLabel})` : resolveName(user);
};

const resolveTargetUserSummary = (entry: ApprovalLogEntry) => {
  if (!entry.targetUser) {
    return '—';
  }

  const targetSummary = resolveUserSummary(entry.targetUser);

  if (!entry.requestedBy) {
    return targetSummary;
  }

  const samePrincipal = resolveName(entry.requestedBy) === resolveName(entry.targetUser);
  return samePrincipal ? `${targetSummary} • Mismo solicitante` : targetSummary;
};

const formatDateTime = (value: Date | null) => {
  if (!value) return 'Pendiente de sincronizar';
  try {
    const dt = DateTime.fromJSDate(value);
    const relative = dt.toRelative({ locale: 'es' });
    const absolute = dt.toFormat('dd LLL yyyy • hh:mm a');
    return relative ? `${absolute} (${relative})` : absolute;
  } catch (error) {
    return value.toLocaleString();
  }
};

const buildSearchIndex = (entry: ApprovalLogEntry) => {
  const parts = [
    MODULE_LABELS[entry.module] || entry.module,
    ACTION_LABELS[entry.action] || entry.action,
    entry.description,
    resolveName(entry.authorizer),
    resolveName(entry.requestedBy),
    resolveName(entry.targetUser),
    entry.target?.name,
    entry.target?.type,
    entry.target?.id,
  ];

  if (entry.metadata) {
    parts.push(JSON.stringify(entry.metadata).toLowerCase());
  }

  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const PAGE_SIZE = 15;

const resolveModuleLabel = (module: string) => MODULE_LABELS[module] || module || 'General';

const resolveModuleLabelForEntry = (entry: ApprovalLogEntry) => {
  if (isCashRegisterEntry(entry)) {
    return MODULE_LABELS.cashRegister;
  }
  return resolveModuleLabel(entry.module);
};

const resolveModuleColorForEntry = (entry: ApprovalLogEntry) => {
  if (isCashRegisterEntry(entry)) {
    return MODULE_COLORS.cashRegister || MODULE_COLORS.generic;
  }
  return MODULE_COLORS[entry.module] || MODULE_COLORS.generic;
};

const resolveActionLabel = (action: string) => ACTION_LABELS[action] || action || 'Acción';

const resolveActionColor = (action: string) => ACTION_COLORS[action] || '#0ea5e9';

const resolveTargetSummary = (entry: ApprovalLogEntry) => {
  const target = entry.target;
  const metadata = (entry.metadata || {});

  const pieces: string[] = [];

  if (target?.type) {
    pieces.push(TARGET_LABELS[target.type] || target.type);
  }

  if (typeof metadata.module === 'string' && metadata.module !== entry.module) {
    pieces.push(resolveModuleLabel(metadata.module));
  }

  const targetDetails =
    target?.details && typeof target.details === 'object'
      ? (target.details)
      : null;

  const authorizationType =
    typeof (metadata).authorizationType === 'string'
      ? String((metadata).authorizationType)
      : targetDetails && typeof targetDetails.authorizationType === 'string'
      ? String(targetDetails.authorizationType)
      : null;

  if (authorizationType === 'invoice-edit') {
    pieces.push('Edición de factura');
  }

  if (metadata.reference) {
    pieces.push(`Ref. ${metadata.reference}`);
  } else if (metadata.invoiceNumber || metadata.invoiceId) {
    const invoiceRef = metadata.invoiceNumber || metadata.invoiceId;
    pieces.push(`Factura ${invoiceRef}`);
  } else if (target?.name) {
    pieces.push(String(target.name));
  }

  if (target?.details && typeof target.details === 'object') {
    const details = target.details;
    if (typeof details.stage === 'string') {
      pieces.push(details.stage === 'opening' ? 'Apertura' : details.stage === 'closing' ? 'Cierre' : details.stage);
    }
  }

  return pieces.length ? pieces.join(' • ') : '—';
};

const matchesModuleFilter = (entry: ApprovalLogEntry, moduleFilter?: string) => {
  if (!moduleFilter) return true;
  if (moduleFilter === 'cashRegister') {
    return isCashRegisterEntry(entry);
  }
  return entry.module === moduleFilter;
};

const ApprovalLogs = ({ searchTerm = '' }: ApprovalLogsProps) => {
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ApprovalLogEntry[]>([]);
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const [loadError, setLoadError] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [datePickerValue, setDatePickerValue] = useState<RangeValue | null>(() => {
    const { startDate, endDate } = getDateRange('today');
    if (typeof startDate === 'number' && typeof endDate === 'number') {
      return [dayjs(startDate), dayjs(endDate)];
    }
    return null;
  });

  const startDateFilter = datePickerValue?.[0]
    ? datePickerValue[0].startOf('day').valueOf()
    : undefined;
  const endDateFilter = datePickerValue?.[1]
    ? datePickerValue[1].endOf('day').valueOf()
    : undefined;

  const handleDatePickerChange = useCallback(
    (value: Dayjs | RangeValue | null) => {
      if (!value) {
        setDatePickerValue(null);
        return;
      }

      if (Array.isArray(value)) {
        const [start, end] = value;
        setDatePickerValue([start || null, end || null]);
        return;
      }

      setDatePickerValue([value, value]);
    },
    []
  );

  const loadLogs = useCallback(async () => {
    if (!user?.businessID) {
      setLogs([]);
      return;
    }

    setLoading(true);
    try {
      const queryOptions: any = { limitCount: 200 };
      if (typeof startDateFilter === 'number') {
        queryOptions.startDate = startDateFilter;
      }
      if (typeof endDateFilter === 'number') {
        queryOptions.endDate = endDateFilter;
      }

      const data = (await fbListApprovalLogs(user, queryOptions)) as ApprovalLogEntry[];
      setLogs(data);
      setLoadError('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error cargando el historial de autorizaciones.';
      setLoadError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, startDateFilter, endDateFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const modulesAvailable = useMemo(() => {
    const set = new Set<string>();
    let cashRegisterFound = false;

    logs.forEach((entry) => {
      if (entry.module) {
        set.add(entry.module);
      }
      if (!cashRegisterFound && isCashRegisterEntry(entry)) {
        cashRegisterFound = true;
      }
    });

    if (cashRegisterFound) {
      set.add('cashRegister');
    }

    return Array.from(set).sort();
  }, [logs]);

  const moduleOptions = useMemo(
    () =>
      modulesAvailable.map((module) => ({
        value: module,
        label: resolveModuleLabel(module),
      })),
    [modulesAvailable]
  );

  const handleModuleFilterChange = useCallback(
    (value: string | undefined) => {
      setModuleFilter(value && value.length ? value : undefined);
    },
    []
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      if (!matchesModuleFilter(entry, moduleFilter)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return buildSearchIndex(entry).includes(normalizedSearch);
    });
  }, [logs, moduleFilter, normalizedSearch]);

  const tableRows = useMemo(
    () =>
      filteredLogs.map((entry) => ({
        id: entry.id,
        entry,
      })),
    [filteredLogs]
  );

  const totalPages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  useEffect(() => {
    setPage(1);
  }, [moduleFilter, normalizedSearch, filteredLogs.length, startDateFilter, endDateFilter]);

  const paginatedRows = useMemo(
    () => tableRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [tableRows, page]
  );

  return (
    <Wrapper>
      <Controls>
        <FilterGroup>
          <CommonDatePicker
            mode="range"
            value={datePickerValue ?? undefined}
            onChange={handleDatePickerChange}
            placeholder="Rango de fechas"
            allowClear
            size="middle"
            className="approval-logs-date-picker"
            style={{ minWidth: 260 }}
          />
        </FilterGroup>

        <FilterGroup>
          <Select
            placeholder="Todos los módulos"
            allowClear
            value={moduleFilter}
            onChange={(value) => handleModuleFilterChange(value)}
            options={moduleOptions}
            style={{ minWidth: 220 }}
            size="middle"
          />
        </FilterGroup>

        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={loadLogs}
          loading={loading}
        >
          Actualizar
        </Button>
      </Controls>

      {loadError && <ErrorBanner>{loadError}</ErrorBanner>}

      <TableContainer>
        {loading && (
          <LoadingOverlay>
            <Spinner />
          </LoadingOverlay>
        )}

        {filteredLogs.length === 0 && !loading ? (
          <EmptyState>
            {normalizedSearch
              ? 'No se encontraron registros que coincidan con la búsqueda aplicada.'
              : 'Todavía no hay autorizaciones registradas.'}
          </EmptyState>
        ) : (
          <>
            <TableElement>
              <thead>
                <tr>
                  <TableHeadCell>Fecha</TableHeadCell>
                  <TableHeadCell>Módulo / acción</TableHeadCell>
                  <TableHeadCell>Descripción</TableHeadCell>
                  <TableHeadCell>Solicitado por</TableHeadCell>
                  <TableHeadCell>Autorizado por</TableHeadCell>
                  <TableHeadCell>
                    <Tooltip title="Usuario que recibe el permiso. Coincide con el solicitante cuando autorizan para sí mismos.">
                      Autorizado para
                    </Tooltip>
                  </TableHeadCell>
                  <TableHeadCell>Resumen</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map(({ id, entry }) => {
                  const moduleColor = resolveModuleColorForEntry(entry);

                  return (
                    <TableRow key={id}>
                      <TableCell>
                        <Text>{formatDateTime(entry.createdAt)}</Text>
                      </TableCell>
                      <TableCell>
                        <TagPill $color={moduleColor}>{resolveModuleLabelForEntry(entry)}</TagPill>
                        <TagPill $color={resolveActionColor(entry.action)}>{resolveActionLabel(entry.action)}</TagPill>
                        {entry.sameUser && <TagPill $color="#f59e0b">Mismo usuario</TagPill>}
                      </TableCell>
                      <TableCell>
                        <Text>{entry.description || 'Sin descripción'}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{resolveUserSummary(entry.requestedBy)}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{resolveUserSummary(entry.authorizer)}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{resolveTargetUserSummary(entry)}</Text>
                      </TableCell>
                      <TableCell>
                        <Text>{resolveTargetSummary(entry)}</Text>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </TableElement>

            {totalPages > 1 && (
              <PaginationControls>
                <PaginationButton onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
                  Anterior
                </PaginationButton>
                <PaginationInfo>
                  Página {page} de {totalPages}
                </PaginationInfo>
                <PaginationButton
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </PaginationButton>
              </PaginationControls>
            )}
          </>
        )}
      </TableContainer>
    </Wrapper>
  );
};

export default ApprovalLogs;
