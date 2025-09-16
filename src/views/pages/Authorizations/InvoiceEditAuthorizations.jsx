import { useEffect, useState } from 'react';
import { Tag, Button, Space, Typography, message, Popconfirm } from 'antd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../features/auth/userSlice';
import { listInvoiceEditAuthorizations, approveInvoiceEditAuthorization, rejectInvoiceEditAuthorization } from '../../../firebase/authorizations/invoiceEditAuthorizations';
import { Select } from 'antd';
import { MenuApp } from '../../templates/MenuApp/MenuApp';
import { AdvancedTable } from '../../templates/system/AdvancedTable/AdvancedTable';

const { Title, Text } = Typography;

const statusColor = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  expired: 'default',
  used: 'blue',
};

export const InvoiceEditAuthorizations = () => {
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const allowed = ['admin', 'owner', 'dev', 'manager'].includes(user?.role);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  const load = async (statusArg) => {
    setLoading(true);
    try {
      const data = await listInvoiceEditAuthorizations(user, { status: statusArg || statusFilter, limitCount: 200 });
      setRows(data.map(d => ({ key: d.id, ...d })));
    } catch (e) {
      message.error(e?.message || 'Error cargando solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (allowed) load(); }, [user?.businessID, allowed, statusFilter]);

  const handleApprove = async (id) => {
    try {
      await approveInvoiceEditAuthorization(user, id, user);
      message.success('Solicitud aprobada');
      load();
    } catch (e) {
      message.error(e?.message || 'Error aprobando');
    }
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
      Header: 'Factura',
      accessor: 'invoice',
      align: 'left',
      minWidth: '140px',
      maxWidth: '1fr',
    },
    {
      Header: 'Solicitado por',
      accessor: 'requestedByName',
      align: 'left',
      minWidth: '180px',
      maxWidth: '1fr',
    },
    {
      Header: 'Motivos',
      accessor: 'reasonsText',
      align: 'left',
      minWidth: '200px',
      maxWidth: '2fr',
    },
    {
      Header: 'Creada',
      accessor: 'createdStr',
      align: 'left',
      minWidth: '180px',
      maxWidth: '1fr',
    },
    {
      Header: 'Expira',
      accessor: 'expiresStr',
      align: 'left',
      minWidth: '180px',
      maxWidth: '1fr',
    },
    {
      Header: 'Estado',
      accessor: 'status',
      align: 'left',
      minWidth: '120px',
      maxWidth: '0.8fr',
      cell: ({ value }) => <Tag color={statusColor[value] || 'default'}>{value}</Tag>,
    },
    {
      Header: 'Acción',
      accessor: 'action',
      align: 'right',
      minWidth: '200px',
      maxWidth: '1fr',
      cell: ({ value }) => (
        <Space>
          <Button type="primary" onClick={() => handleApprove(value?.id)}>Aprobar</Button>
          <Popconfirm title="¿Rechazar solicitud?" onConfirm={() => handleReject(value?.id)}>
            <Button danger>Rechazar</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  if (statusFilter !== 'pending') {
    columns = columns.map(col => col.accessor === 'action' ? { ...col, cell: () => <span>-</span> } : col);
  }

  const tableData = rows.map(r => ({
    invoice: r.invoiceNumber || r.invoiceId,
    requestedByName: r?.requestedBy?.name || '',
    reasonsText: (r.reasons || []).join(', '),
    createdStr: r.createdAt?.toDate ? new Date(r.createdAt.toDate()).toLocaleString() : '-',
    expiresStr: r.expiresAt?.toDate ? new Date(r.expiresAt.toDate()).toLocaleString() : '-',
    status: r.status,
    action: { id: r.key, status: r.status },
  }));

  const filteredRows = rows.filter(r => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    const by = (r.requestedBy?.name || '').toLowerCase();
    const inv = (r.invoiceNumber || r.invoiceId || '').toLowerCase();
    const reasons = (r.reasons || []).join(', ').toLowerCase();
    return by.includes(t) || inv.includes(t) || reasons.includes(t);
  });

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'min-content 1fr', height: '100%' }}>
      <MenuApp
        displayName='Autorizaciones'
        data={rows}
        searchData={searchTerm}
        setSearchData={setSearchTerm}
        showNotificationButton={false}
      />
      <div style={{ padding: 16 }}>
        {!allowed && (
          <div>
            <Title level={4}>No autorizado</Title>
            <Text>Esta sección está disponible solo para administradores.</Text>
          </div>
        )}
        {allowed && (
          <>
            <Title level={4} style={{ marginTop: 8 }}>Solicitudes de autorización de edición de facturas</Title>
            <div style={{ marginTop: 12, marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span>Estado:</span>
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
              <Button onClick={() => load()}>Refrescar</Button>
            </div>
            <div style={{ height: 'calc(100vh - 260px)' }}>
              <AdvancedTable
                columns={columns}
                data={tableData}
                searchTerm={searchTerm}
                numberOfElementsPerPage={40}
                tableName={'Autorizaciones'}
                elementName={'solicitudes'}
                loading={loading}
                emptyText={'No hay autorizaciones para mostrar'}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceEditAuthorizations;




