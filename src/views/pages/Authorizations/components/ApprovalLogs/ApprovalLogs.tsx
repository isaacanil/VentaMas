import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import { DateTime } from 'luxon';
import { selectUser } from '../../../../../features/auth/userSlice';
import { fbListApprovalLogs } from '../../../../../firebase/authorization/approvalLogs';

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

const SelectControl = styled.select`
  min-width: 200px;
  padding: 8px 32px 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff url('data:image/svg+xml,%3Csvg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M1 1L5 5L9 1" stroke="%236B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E') no-repeat right 10px center;
  appearance: none;
  font-size: 13px;
  color: #1f2937;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  }
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    background: #1d4ed8;
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.25);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const RefreshSymbol = styled.span`
  font-size: 14px;
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
  authorizationRequests: 'Solicitudes',
};

const MODULE_COLORS: Record<string, string> = {
  invoices: '#2563eb',
  accountsReceivable: '#f97316',
  authorizationRequests: '#8b5cf6',
  generic: '#6b7280',
};

const ACTION_LABELS: Record<string, string> = {
  'authorization-request-approve': 'Aprobada',
  'authorization-request-reject': 'Rechazada',
  'cash-register-opening': 'Apertura autorizada',
  'cash-register-closing': 'Cierre autorizado',
  'invoice-discount-override': 'Autorización de descuento',
  authorization: 'Autorizada',
};

const ACTION_COLORS: Record<string, string> = {
  'authorization-request-approve': '#0ea5e9',
  'authorization-request-reject': '#ef4444',
  'cash-register-opening': '#22c55e',
  'cash-register-closing': '#9333ea',
  'invoice-discount-override': '#22d3ee',
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

const resolveName = (user?: UserSnapshot | null) =>
  user?.name || user?.email || user?.uid || '—';

const resolveUserSummary = (user?: UserSnapshot | null) => {
  if (!user) return '—';
  const roleLabel = user.role ? ROLE_LABELS[user.role] || user.role : '';
  return roleLabel ? `${resolveName(user)} (${roleLabel})` : resolveName(user);
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

const resolveActionLabel = (action: string) => ACTION_LABELS[action] || action || 'Acción';

const resolveActionColor = (action: string) => ACTION_COLORS[action] || '#0ea5e9';

const resolveTargetSummary = (entry: ApprovalLogEntry) => {
  const target = entry.target;
  const metadata = entry.metadata || {};

  const pieces: string[] = [];

  if (target?.type) {
    pieces.push(TARGET_LABELS[target.type] || target.type);
  }

  if (typeof metadata.module === 'string' && metadata.module !== entry.module) {
    pieces.push(resolveModuleLabel(metadata.module));
  }

  if (metadata.reference) {
    pieces.push(`Ref. ${metadata.reference}`);
  } else if (metadata.invoiceNumber || metadata.invoiceId) {
    const invoiceRef = metadata.invoiceNumber || metadata.invoiceId;
    pieces.push(`Factura ${invoiceRef}`);
  } else if (target?.name) {
    pieces.push(String(target.name));
  }

  if (target?.id && !pieces.some((piece) => piece.includes(String(target.id)))) {
    pieces.push(`ID ${target.id}`);
  }

  if (target?.details && typeof target.details === 'object') {
    const details = target.details as Record<string, unknown>;
    if (typeof details.stage === 'string') {
      pieces.push(details.stage === 'opening' ? 'Apertura' : details.stage === 'closing' ? 'Cierre' : details.stage);
    }
  }

  return pieces.length ? pieces.join(' • ') : '—';
};

const ApprovalLogs = ({ searchTerm = '' }: ApprovalLogsProps) => {
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ApprovalLogEntry[]>([]);
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const [loadError, setLoadError] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const loadLogs = useCallback(async () => {
    if (!user?.businessID) {
      setLogs([]);
      return;
    }

    setLoading(true);
    try {
      const data = (await fbListApprovalLogs(user, { limitCount: 200 })) as ApprovalLogEntry[];
      setLogs(data);
      setLoadError('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error cargando el historial de autorizaciones.';
      setLoadError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const modulesAvailable = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((entry) => {
      if (entry.module) {
        set.add(entry.module);
      }
    });
    return Array.from(set).sort();
  }, [logs]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      if (moduleFilter && entry.module !== moduleFilter) {
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
  }, [moduleFilter, normalizedSearch, filteredLogs.length]);

  const paginatedRows = useMemo(
    () => tableRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [tableRows, page]
  );

  return (
    <Wrapper>
      <Controls>
        <FilterGroup>
          <SelectControl
            value={moduleFilter ?? ''}
            onChange={(event) => setModuleFilter(event.target.value || undefined)}
          >
            <option value="">Todos los módulos</option>
            {modulesAvailable.map((module) => (
              <option key={module} value={module}>
                {resolveModuleLabel(module)}
              </option>
            ))}
          </SelectControl>
        </FilterGroup>

        <RefreshButton onClick={loadLogs} disabled={loading}>
          <RefreshSymbol>↻</RefreshSymbol>
          Actualizar
        </RefreshButton>
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
                  <TableHeadCell>Autorizado para</TableHeadCell>
                  <TableHeadCell>Resumen</TableHeadCell>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map(({ id, entry }) => {
                  const moduleColor = MODULE_COLORS[entry.module] || MODULE_COLORS.generic;

                  return (
                    <TableRow key={id}>
                      <TableCell>
                        <Text>{formatDateTime(entry.createdAt)}</Text>
                      </TableCell>
                      <TableCell>
                        <TagPill $color={moduleColor}>{resolveModuleLabel(entry.module)}</TagPill>
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
                        <Text>{resolveUserSummary(entry.targetUser)}</Text>
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
