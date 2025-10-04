import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Badge, Button, Empty, Spin } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../features/auth/userSlice';
import {
  listenToAuthorizationsByStatus,
  approveAuthorizationRequest,
  rejectAuthorizationRequest,
} from '../../../../../firebase/authorizations/invoiceEditAuthorizations';
import { resolveModuleMeta } from '../../../../pages/Authorizations/components/AuthorizationRequests/utils/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');


const AuthorizationsWidget = () => {
  const user = useSelector(selectUser);
  const [authorizations, setAuthorizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const privilegedRoles = new Set(['admin', 'owner', 'dev', 'manager']);
  const isAdmin = privilegedRoles.has(user?.role ?? '');
  const businessID = user?.businessID;

  useEffect(() => {
    if (!businessID) return;

    // Admins y roles privilegiados ven todas las solicitudes pendientes
    // Cajeros ven solo sus pendientes
    const status = 'pending';
    const userId = isAdmin ? null : user?.uid; // Admins ven todas, cajeros solo las suyas

    const unsubscribe = listenToAuthorizationsByStatus(
      businessID,
      status,
      userId,
      (data) => {
        // Ordenar: pendientes primero, luego por fecha
        const sorted = data
          .slice()
          .sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;

            const toMillis = (value) => {
              if (!value) return 0;
              if (typeof value === 'number') {
                return value > 1e12 ? value : value * 1000;
              }
              if (typeof value.toMillis === 'function') {
                return value.toMillis();
              }
              if (value instanceof Date) {
                return value.getTime();
              }
              if (typeof value === 'object' && typeof value.seconds === 'number') {
                return value.seconds * 1000;
              }
              return 0;
            };

            const dateA = toMillis(a.createdAt);
            const dateB = toMillis(b.createdAt);
            return dateB - dateA;
          });
        setAuthorizations(sorted);
        setLoading(false);
      },
      (error) => {
        console.error('Error escuchando autorizaciones:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe?.();
  }, [businessID, isAdmin, user?.uid]);

  const handleApprove = async (authId) => {
    try {
      setProcessingId(authId);
      await approveAuthorizationRequest(user, authId, user);
    } catch (error) {
      console.error('Error aprobando:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (authId) => {
    try {
      setProcessingId(authId);
      await rejectAuthorizationRequest(user, authId, user);
    } catch (error) {
      console.error('Error rechazando:', error);
    } finally {
      setProcessingId(null);
    }
  };

const getStatusConfig = (status) => {
  const configs = {
    pending: {
      icon: <ClockCircleOutlined />,
      color: '#f59e0b',
      text: 'Pendiente',
    },
    approved: {
      icon: <CheckCircleOutlined />,
      color: '#22c55e',
      text: 'Aprobada',
    },
    rejected: {
      icon: <CloseCircleOutlined />,
      color: '#ef4444',
      text: 'Rechazada',
    },
    used: {
      icon: <CheckCircleOutlined />,
      color: '#2563eb',
      text: 'Usada',
    },
    expired: {
      icon: <ExclamationCircleOutlined />,
      color: '#64748b',
      text: 'Expirada',
    },
  };
  return configs[status] || configs.pending;
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate?.() || new Date(timestamp);
  return dayjs(date).fromNow();
};

const resolveReference = (auth) => {
  if (!auth) return '-';
  const metadata = typeof auth.metadata === 'object' && auth.metadata !== null ? auth.metadata : {};
  return (
    auth.reference ||
    metadata.reference ||
    metadata.invoiceNumber ||
    metadata.invoiceId ||
    auth.invoiceNumber ||
    auth.invoiceId ||
    '-'
  );
};

const resolvePersonName = (person) => {
  if (!person) return '';
  return person.displayName || person.name || person.email || '';
};

  if (loading) {
    return (
      <WidgetContainer>
        <WidgetHeader>
          <WidgetTitle>Autorizaciones</WidgetTitle>
        </WidgetHeader>
        <LoadingContainer>
          <Spin />
        </LoadingContainer>
      </WidgetContainer>
    );
  }

  if (authorizations.length === 0) {
    return (
      <WidgetContainer>
        <WidgetHeader>
          <WidgetTitle>Autorizaciones</WidgetTitle>
        </WidgetHeader>
        <EmptyContainer>
          <Empty
            description={isAdmin ? 'No hay solicitudes pendientes' : 'No tienes solicitudes pendientes'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </EmptyContainer>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer>
      <WidgetHeader>
        <WidgetTitle>
          Autorizaciones
          {isAdmin && authorizations.length > 0 && (
            <Badge 
              count={authorizations.length} 
              style={{ marginLeft: 8 }}
            />
          )}
        </WidgetTitle>
      </WidgetHeader>

      <AuthorizationsList>
        {authorizations.map((auth) => {
          const statusConfig = getStatusConfig(auth.status);
          const isPending = auth.status === 'pending';
          const isProcessing = processingId === auth.id;
          const moduleMeta = resolveModuleMeta(auth);
          const referenceValue = resolveReference(auth);
          const requestedByName = resolvePersonName(auth.requestedBy) || 'Usuario';

          return (
            <AuthorizationCard key={auth.id}>
              <CardHeader>
                <ModuleHeading>
                  <ModuleIcon>
                    <FontAwesomeIcon icon={moduleMeta.icon} />
                  </ModuleIcon>
                  <ModuleSummary>
                    <ModuleTitle>{moduleMeta.title}</ModuleTitle>
                    <ReferenceLabel>
                      {moduleMeta.referenceLabel}: <strong>{referenceValue}</strong>
                    </ReferenceLabel>
                  </ModuleSummary>
                </ModuleHeading>
                <StatusPill $color={statusConfig.color}>{statusConfig.text}</StatusPill>
              </CardHeader>

              <CardMeta>
                <MetaItem>
                  <MetaLabel>Solicitó</MetaLabel>
                  <MetaValue>{requestedByName}</MetaValue>
                </MetaItem>
                <MetaItem>
                  <MetaLabel>Hace</MetaLabel>
                  <MetaValue>{formatTimeAgo(auth.createdAt)}</MetaValue>
                </MetaItem>
              </CardMeta>

              {isAdmin && isPending && (
                <ActionsRow>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleApprove(auth.id)}
                    loading={isProcessing}
                    disabled={isProcessing}
                    size="small"
                  >
                    Aprobar
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleReject(auth.id)}
                    loading={isProcessing}
                    disabled={isProcessing}
                    size="small"
                  >
                    Rechazar
                  </Button>
                </ActionsRow>
              )}
            </AuthorizationCard>
          );
        })}
      </AuthorizationsList>
    </WidgetContainer>
  );
};

const WidgetContainer = styled.div`
  background: white;
  border-radius: 0;
  padding: 16px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-shrink: 0;
`;

const WidgetTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
  display: flex;
  align-items: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 40px;
`;

const EmptyContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

const AuthorizationsList = styled.div`
  display: grid;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
  align-content: start; 

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
`;

const AuthorizationCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  background: #ffffff;
  display: grid;
  gap: 12px;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const ModuleHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ModuleIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 18px;
`;

const ModuleSummary = styled.div`
  display: grid;
  gap: 4px;
`;

const ModuleTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
`;

const ReferenceLabel = styled.div`
  font-size: 13px;
  color: #475569;
`;

const StatusPill = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => $color || '#2563eb'};
  background: ${({ $color }) => `${$color || '#2563eb'}1a`};
  text-transform: capitalize;
`;

const CardMeta = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 120px;
`;

const MetaLabel = styled.span`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
`;

const MetaValue = styled.span`
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  margin-top: 4px;
`;

export default AuthorizationsWidget;
