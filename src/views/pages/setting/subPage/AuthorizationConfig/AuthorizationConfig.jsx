import {
  KeyOutlined,
  ReloadOutlined,
  StopOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import {
  Button,
  Table,
  Tag,
  Space,
  Typography,
  message,
  Modal,
  Card,
  Statistic,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  fbGetUsersWithPinStatus,
  fbGenerateUserPin,
  fbDeactivateUserPin,
} from '@/firebase/authorization/pinAuth';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';

import { GeneratePinModal } from './components/GeneratePinModal';
import { PinDetailsModal } from './components/PinDetailsModal';

const { Title, Text, Paragraph } = Typography;

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
`;

const Content = styled.div`
  padding: 24px;
  overflow-y: auto;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const AVAILABLE_MODULES = [
  { value: 'invoices', label: 'Facturación' },
  { value: 'accountsReceivable', label: 'Cuentas por Cobrar' },
];

const MODULE_LABELS = AVAILABLE_MODULES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export const AuthorizationConfig = () => {
  const user = useSelector(selectUser);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [generatedPin, setGeneratedPin] = useState(null);

  const allowed = ['admin', 'owner', 'dev'].includes(user?.role);

  const loadUsers = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await fbGetUsersWithPinStatus(user);
      setUsers(data);
    } catch (error) {
      message.error(error?.message || 'Error cargando usuarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [allowed, user]);

  useEffect(() => {
    if (allowed) loadUsers();
  }, [allowed, loadUsers]);

  const handleGeneratePin = (userRecord) => {
    setSelectedUser(userRecord);
    setGenerateModalVisible(true);
  };

  const handleConfirmGenerate = async (modules) => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const result = await fbGenerateUserPin(user, selectedUser.id, modules);
      setGeneratedPin(result);
      message.success('PIN generado exitosamente');
      setGenerateModalVisible(false);
      setDetailsModalVisible(true);
      await loadUsers();
    } catch (error) {
      message.error(error?.message || 'Error generando PIN');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivatePin = async (userId, userName) => {
    Modal.confirm({
      title: '¿Desactivar PIN?',
      content: `¿Está seguro de desactivar el PIN del usuario ${userName}? Esta acción no se puede deshacer.`,
      okText: 'Desactivar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        setLoading(true);
        try {
          await fbDeactivateUserPin(user, userId);
          message.success('PIN desactivado exitosamente');
          await loadUsers();
        } catch (error) {
          message.error(error?.message || 'Error desactivando PIN');
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const getStatusTag = (userRecord) => {
    if (!userRecord.hasPin) {
      return <Tag color="default">Sin PIN</Tag>;
    }
    if (userRecord.pinIsExpired) {
      return (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          Expirado
        </Tag>
      );
    }
    if (userRecord.pinIsActive) {
      return (
        <Tag color="green" icon={<SafetyOutlined />}>
          Activo
        </Tag>
      );
    }
    return <Tag color="red">Inactivo</Tag>;
  };

  const renderModuleDetails = (record) => {
    const entries = record?.moduleDetails
      ? Object.entries(record.moduleDetails)
      : [];
    if (!entries.length) {
      return <Text type="secondary">-</Text>;
    }

    return (
      <Space direction="vertical" size={4}>
        {entries.map(([moduleKey, detail]) => {
          const statusLabel = detail?.isActive
            ? 'Activo'
            : detail?.isExpired
              ? 'Expirado'
              : 'Inactivo';
          const tagColor = detail?.isActive
            ? 'green'
            : detail?.isExpired
              ? 'orange'
              : 'default';
          const expiresAt =
            detail?.expiresAt instanceof Date
              ? detail.expiresAt.toLocaleString()
              : null;

          return (
            <div
              key={moduleKey}
              style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text>{MODULE_LABELS[moduleKey] || moduleKey}</Text>
                <Tag color={tagColor}>{statusLabel}</Tag>
              </div>
              {expiresAt && (
                <Text type="secondary" style={{ fontSize: '0.8em' }}>
                  Expira: {expiresAt}
                </Text>
              )}
            </div>
          );
        })}
      </Space>
    );
  };

  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.displayName}</div>
          <div style={{ fontSize: '0.85em', color: '#888' }}>{text}</div>
        </div>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleColors = {
          admin: 'blue',
          owner: 'purple',
          manager: 'cyan',
          cashier: 'default',
        };
        return <Tag color={roleColors[role] || 'default'}>{role}</Tag>;
      },
    },
    {
      title: 'Estado PIN',
      key: 'pinStatus',
      render: (_, record) => getStatusTag(record),
    },
    {
      title: 'Módulos',
      dataIndex: 'pinModules',
      key: 'modules',
      render: (_, record) => renderModuleDetails(record),
    },
    {
      title: 'Expira',
      dataIndex: 'pinExpiresAt',
      key: 'expiresAt',
      render: (date, record) => {
        if (!date) return '-';
        if (record.pinIsExpired) {
          return <Text type="danger">Expirado</Text>;
        }
        const now = new Date();
        const hoursLeft = Math.round((date - now) / (1000 * 60 * 60));
        return (
          <Text type={hoursLeft < 6 ? 'warning' : 'secondary'}>
            {hoursLeft}h restantes
          </Text>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleGeneratePin(record)}
          >
            {record.hasPin ? 'Regenerar' : 'Generar'}
          </Button>
          {record.hasPin && record.pinIsActive && (
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleDeactivatePin(record.id, record.displayName)}
            >
              Desactivar
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.displayName.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  const stats = {
    total: users.length,
    withPin: users.filter((u) => u.hasPin).length,
    active: users.filter((u) => u.pinIsActive).length,
    expired: users.filter((u) => u.pinIsExpired).length,
  };

  if (!allowed) {
    return (
      <Container>
        <MenuApp
          displayName="Configuración de Autorización"
          showNotificationButton={false}
        />
        <Content>
          <Card>
            <Title level={4}>Acceso Denegado</Title>
            <Text>No tienes permisos para acceder a esta sección.</Text>
          </Card>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <MenuApp
        displayName="Configuración de Autorización"
        data={users}
        searchData={searchTerm}
        setSearchData={setSearchTerm}
        showNotificationButton={false}
      />
      <Content>
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>Gestión de PINs de Autorización</Title>
          <Paragraph type="secondary">
            Los PINs permiten a los usuarios autorizarse rápidamente sin
            ingresar su contraseña completa. Los PINs expiran automáticamente
            cada 24 horas por seguridad.
          </Paragraph>
        </div>

        <StatsContainer>
          <Card>
            <Statistic
              title="Total Usuarios"
              value={stats.total}
              prefix={<KeyOutlined />}
            />
          </Card>
          <Card>
            <Statistic
              title="Con PIN Configurado"
              value={stats.withPin}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
          <Card>
            <Statistic
              title="PINs Activos"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
              prefix={<SafetyOutlined />}
            />
          </Card>
          <Card>
            <Statistic
              title="PINs Expirados"
              value={stats.expired}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </StatsContainer>

        <Card>
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              Usuarios
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadUsers}
              loading={loading}
            >
              Actualizar
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={filteredUsers}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <GeneratePinModal
          visible={generateModalVisible}
          onCancel={() => setGenerateModalVisible(false)}
          onConfirm={handleConfirmGenerate}
          user={selectedUser}
          availableModules={AVAILABLE_MODULES}
        />

        <PinDetailsModal
          visible={detailsModalVisible}
          onClose={() => {
            setDetailsModalVisible(false);
            setGeneratedPin(null);
            setSelectedUser(null);
          }}
          pinData={generatedPin}
          user={selectedUser}
        />
      </Content>
    </Container>
  );
};

export default AuthorizationConfig;
