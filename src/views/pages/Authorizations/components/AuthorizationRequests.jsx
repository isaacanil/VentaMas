import { useEffect, useState } from 'react';
import { Tag, Button, Space, Typography, message, Popconfirm, Select, Card } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { selectUser } from '../../../../features/auth/userSlice';
import {
  listInvoiceEditAuthorizations,
  approveInvoiceEditAuthorization,
  rejectInvoiceEditAuthorization
} from '../../../../firebase/authorizations/invoiceEditAuthorizations';
import { AdvancedTable } from '../../../templates/system/AdvancedTable/AdvancedTable';
import { PinAuthorizationModal } from '../../../component/modals/PinAuthorizationModal/PinAuthorizationModal';
import { useAuthorizationPin } from '../../../../hooks/useAuthorizationPin';

const { Title, Text } = Typography;

const statusColor = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  expired: 'default',
  used: 'blue',
};

/**
 * Componente que muestra todas las solicitudes de autorización
 * Por ahora solo facturas, pero diseñado para expandir a otros tipos
 */
export const AuthorizationRequests = ({ searchTerm = '' }) => {
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [pendingApproval, setPendingApproval] = useState(null);

  const { showModal: showPinModal, modalProps } = useAuthorizationPin({
    onAuthorized: (authorizer) => {
      if (pendingApproval) {
        performApproval(pendingApproval, authorizer);
      }
    },
    module: 'invoices',
    description: 'Se requiere autorización para aprobar la edición de factura.',
    allowedRoles: ['admin', 'owner', 'dev', 'manager'],
  });

  const load = async (statusArg) => {
    setLoading(true);
    try {
      const data = await listInvoiceEditAuthorizations(user, {
        status: statusArg || statusFilter,
        limitCount: 200
      });
      setRows(data.map(d => ({ key: d.id, ...d })));
    } catch (e) {
      message.error(e?.message || 'Error cargando solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.businessID) load();
  }, [user?.businessID, statusFilter]);

  const performApproval = async (id, authorizer) => {
    try {
      setLoading(true);
      await approveInvoiceEditAuthorization(user, id, authorizer);
      message.success('Solicitud aprobada con PIN');
      setPendingApproval(null);
      load();
    } catch (e) {
      message.error(e?.message || 'Error aprobando');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setPendingApproval(id);
    showPinModal();
  };

  const handleReject = async (id) => {
    try {
      await rejectInvoiceEditAuthorization(user, id, user);
      message.info('Solicitud rechazada');
      load();
    } catch (e) {
      message.error(e?.message || 'Error rechazando');
    }
  };

  let columns = [
    {
      Header: 'Tipo',
      accessor: 'type',
      align: 'left',
      minWidth: '120px',
      maxWidth: '120px',
      keepWidth: true,
    },
    {
      Header: 'Referencia',
      accessor: 'invoice',
      align: 'left',
      minWidth: '150px',
      maxWidth: '150px',
      keepWidth: true,
    },
    {
      Header: 'Solicitado por',
      accessor: 'requestedByName',
      align: 'left',
      minWidth: '200px',
      maxWidth: '1.5fr',
    },
    {
      Header: 'Motivos',
      accessor: 'reasonsText',
      align: 'left',
      minWidth: '250px',
      maxWidth: '2fr',
    },
    {
      Header: 'Creada',
      accessor: 'createdStr',
      align: 'left',
      minWidth: '180px',
      maxWidth: '180px',
      keepWidth: true,
    },
    {
      Header: 'Expira',
      accessor: 'expiresStr',
      align: 'left',
      minWidth: '180px',
      maxWidth: '180px',
      keepWidth: true,
    },
    {
      Header: 'Estado',
      accessor: 'status',
      align: 'center',
      minWidth: '130px',
      maxWidth: '130px',
      keepWidth: true,
      cell: ({ value }) => <Tag color={statusColor[value] || 'default'}>{value}</Tag>,
    },
    {
      Header: 'Acción',
      accessor: 'action',
      align: 'right',
      minWidth: '240px',
      maxWidth: '240px',
      keepWidth: true,
      cell: ({ value }) => (
        <Space>
          <Button type="primary" size="small" onClick={() => handleApprove(value?.id)}>
            Aprobar
          </Button>
          <Popconfirm title="¿Rechazar solicitud?" onConfirm={() => handleReject(value?.id)}>
            <Button danger size="small">Rechazar</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  if (statusFilter !== 'pending') {
    columns = columns.map(col =>
      col.accessor === 'action' ? { ...col, cell: () => <span>-</span> } : col
    );
  }

  const tableData = rows.map(r => ({
    type: 'Factura', // Por ahora solo facturas, expandir en el futuro
    invoice: r.invoiceNumber || r.invoiceId,
    requestedByName: r?.requestedBy?.name || '',
    reasonsText: (r.reasons || []).join(', '),
    createdStr: r.createdAt?.toDate ? new Date(r.createdAt.toDate()).toLocaleString() : '-',
    expiresStr: r.expiresAt?.toDate ? new Date(r.expiresAt.toDate()).toLocaleString() : '-',
    status: r.status,
    action: { id: r.key, status: r.status },
  }));

  const filteredRows = tableData.filter(r => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      r.invoice.toLowerCase().includes(t) ||
      r.requestedByName.toLowerCase().includes(t) ||
      r.reasonsText.toLowerCase().includes(t)
    );
  });

  return (
    <>
      <StyledCard>
        <FilterBar>
          <FilterGroup>
            <FilterLabel>Estado:</FilterLabel>
            <Select
              value={statusFilter}
              style={{ width: 200 }}
              onChange={(v) => setStatusFilter(v)}
              options={[
                { value: 'pending', label: 'Pendientes' },
                { value: 'completed', label: 'Completadas' },
                { value: 'approved', label: 'Aprobadas' },
                { value: 'rejected', label: 'Rechazadas' },
                { value: 'used', label: 'Usadas' },
                { value: 'expired', label: 'Expiradas' },
                { value: 'all', label: 'Todas' },
              ]}
            />
          </FilterGroup>
          <Button icon={<ReloadOutlined />} onClick={() => load()} loading={loading}>
            Actualizar
          </Button>
        </FilterBar>

        <TableWrapper>
          <AdvancedTable
            columns={columns}
            data={filteredRows}
            searchTerm={searchTerm}
            numberOfElementsPerPage={20}
            tableName="Solicitudes"
            elementName="solicitudes"
            loading={loading}
            emptyText="No hay solicitudes para mostrar"
            rowSize="medium"
          />
        </TableWrapper>
      </StyledCard>

      <PinAuthorizationModal {...modalProps} />
    </>
  );
};

// Styled components
const StyledCard = styled(Card)`
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
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const FilterLabel = styled.span`
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
`;

const TableWrapper = styled.div`
  display: grid;
  flex: 1;
  overflow: hidden;
  min-height: 400px;
`;

export default AuthorizationRequests;
