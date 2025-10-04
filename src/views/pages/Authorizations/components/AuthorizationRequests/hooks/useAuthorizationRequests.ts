import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  listAuthorizationRequests,
  approveAuthorizationRequest,
  rejectAuthorizationRequest,
} from '../../../../../../firebase/authorizations/invoiceEditAuthorizations';
import { formatDateTime } from '../constants/constants';
import { resolveModuleMeta } from '../utils/utils';
import type {
  AppUser,
  AuthorizationRequest,
  AuthorizationRequestListItem,
} from '../types';

const DEFAULT_COLLECTION_KEY = 'authorizationRequests';
const LEGACY_COLLECTION_KEY = 'invoiceEditAuthorizations';

export type StatusFilterValue =
  | 'pending'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'used'
  | 'expired'
  | 'all';

interface ListOptions {
  status?: string;
  limitCount?: number;
  modules?: string[];
}

type ListAuthorizationRequestsFn = (
  user: AppUser | null | undefined,
  options: ListOptions
) => Promise<AuthorizationRequest[]>;

type ApproveAuthorizationFn = (
  user: AppUser | null | undefined,
  requestId: string,
  authorizer: AppUser
) => Promise<void>;

type RejectAuthorizationFn = (
  user: AppUser | null | undefined,
  requestId: string,
  approver: AppUser | null | undefined
) => Promise<void>;

const listAuthorizationRequestsTyped =
  listAuthorizationRequests as ListAuthorizationRequestsFn;
const approveAuthorizationRequestTyped =
  approveAuthorizationRequest as ApproveAuthorizationFn;
const rejectAuthorizationRequestTyped =
  rejectAuthorizationRequest as RejectAuthorizationFn;

export const useAuthorizationRequests = (
  user: AppUser | null | undefined,
  searchTerm = '',
  dateRange: [string, string] | null = null
) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AuthorizationRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('pending');
  const [pendingApproval, setPendingApproval] = useState<string | null>(null);
  const [detailRequest, setDetailRequest] = useState<AuthorizationRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const load = async (statusArg?: StatusFilterValue) => {
    setLoading(true);
    try {
      const data = await listAuthorizationRequestsTyped(user, {
        status: statusArg || statusFilter,
        limitCount: 200,
      });

      const normalized = data.map((item) => ({
        key:
          typeof item.key === 'string' && item.key
            ? item.key
            : typeof item.id === 'string' && item.id
            ? item.id
            : String(item.id ?? Math.random().toString(36).slice(2)),
        ...item,
      }));
      setRows(normalized);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : 'Error cargando solicitudes';
      message.error(messageText);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.businessID) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.businessID, statusFilter, dateRange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateRange]);

  useEffect(() => {
    if (!detailRequest?.key) return;
    const updated = rows.find((row) => row.key === detailRequest.key);
    if (updated && updated !== detailRequest) {
      setDetailRequest(updated);
    }
  }, [rows, detailRequest]);

  const performApproval = async (id: string, authorizer: AppUser) => {
    try {
      setLoading(true);
      await approveAuthorizationRequestTyped(user, id, authorizer);
      message.success('Solicitud aprobada con PIN');
      setPendingApproval(null);
      load();
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : 'Error aprobando';
      message.error(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setPendingApproval(id);
    return id;
  };

  const handleReject = async (id: string) => {
    try {
      await rejectAuthorizationRequestTyped(user, id, user);
      message.info('Solicitud rechazada');
      load();
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : 'Error rechazando';
      message.error(messageText);
    }
  };

  const handleViewDetails = (request: AuthorizationRequest) => {
    if (request) {
      setDetailRequest(request);
    }
  };

  const closeDetailModal = () => setDetailRequest(null);

  const requestsForUi = useMemo<AuthorizationRequestListItem[]>(
    () =>
      rows.map((record) => {
        const moduleMeta = resolveModuleMeta(record);
        const metadataSource =
          typeof record.metadata === 'object' && record.metadata !== null
            ? (record.metadata as Record<string, unknown>)
            : {};
        const metadataReference =
          typeof metadataSource?.['reference'] === 'string' ? (metadataSource['reference'] as string) : '';
        const metadataNote =
          typeof metadataSource?.['note'] === 'string' ? (metadataSource['note'] as string) : '';
        const requestNote =
          record.requestNote ||
          record.note ||
          record.notes ||
          metadataNote ||
          '';
        const resolvedCollectionKey =
          record.collectionKey ||
          record.legacyCollectionKey ||
          (record.module === 'invoices' ? DEFAULT_COLLECTION_KEY : DEFAULT_COLLECTION_KEY);
        const referenceValue =
          record.reference ||
          metadataReference ||
          record.invoiceNumber ||
          record.invoiceId ||
          '-';

        return {
          key: record.key ?? '',
          raw: {
            ...record,
            module: record.module || moduleMeta.moduleKey,
            collectionKey:
              resolvedCollectionKey === LEGACY_COLLECTION_KEY && record.collectionKey === undefined
                ? LEGACY_COLLECTION_KEY
                : resolvedCollectionKey,
          },
          moduleMeta,
          reference: referenceValue,
          requestedByName: record?.requestedBy?.name || '',
          requestedByEmail: record?.requestedBy?.email || '',
          requestNote,
          createdStr: formatDateTime(record.createdAt),
          expiresStr: formatDateTime(record.expiresAt),
          status: record.status ?? 'pending',
        };
      }),
    [rows]
  );

  const filteredRequests = useMemo(() => {
    let filtered = requestsForUi;

    // Filtro por búsqueda de texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(({ moduleMeta, reference, requestedByName, requestNote }) => {
        const moduleMatch = (moduleMeta?.title || '').toLowerCase().includes(term);
        const referenceMatch = (reference || '').toLowerCase().includes(term);
        const requesterMatch = (requestedByName || '').toLowerCase().includes(term);
        const noteMatch = (requestNote || '').toLowerCase().includes(term);
        return moduleMatch || referenceMatch || requesterMatch || noteMatch;
      });
    }

    // Filtro por rango de fechas
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = new Date(dateRange[0]);
      const endDate = new Date(dateRange[1]);
      endDate.setHours(23, 59, 59, 999); // Incluir todo el día final

      filtered = filtered.filter((item) => {
        const createdAt = item.raw.createdAt;
        if (!createdAt) return false;
        
        // Manejar diferentes formatos de fecha (Date, Timestamp de Firebase, string, number)
        let itemDate: Date;
        if (createdAt instanceof Date) {
          itemDate = createdAt;
        } else if (typeof createdAt === 'object' && 'toDate' in createdAt && typeof createdAt.toDate === 'function') {
          // Firebase Timestamp
          itemDate = createdAt.toDate();
        } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
          itemDate = new Date(createdAt);
        } else {
          return false;
        }
        
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    return filtered;
  }, [requestsForUi, searchTerm, dateRange]);

  return {
    loading,
    rows,
    statusFilter,
    setStatusFilter,
    pendingApproval,
    setPendingApproval,
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
  };
};
