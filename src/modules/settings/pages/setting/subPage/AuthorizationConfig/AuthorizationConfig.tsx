import {
  KeyOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
} from '@/constants/icons/antd';
import { Button, Table, Typography, Card, Statistic } from 'antd';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import type { ColumnsType } from 'antd/es/table';

import { selectUser } from '@/features/auth/userSlice';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { hasAuthorizationPinUsersManageAccess } from '@/utils/access/authorizationAccess';

import { GeneratePinModal } from './components/GeneratePinModal';
import { PinDetailsModal } from './components/PinDetailsModal';
import { useAuthorizationPinManager } from './hooks/useAuthorizationPinManager';
import type { PinUserRecord } from './types';
import {
  AVAILABLE_MODULES,
  createAuthorizationColumns,
  filterUsersBySearchTerm,
  getAuthorizationStats,
} from './utils/authorizationConfig';

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

export const AuthorizationConfig = () => {
  const user = useSelector(selectUser);
  const [searchTerm, setSearchTerm] = useState('');
  const allowed = hasAuthorizationPinUsersManageAccess(user);
  const {
    closeDetailsModal,
    closeGenerateModal,
    generatedPin,
    handleConfirmGenerate,
    handleDeactivatePin,
    isDetailsModalVisible,
    isGenerateModalVisible,
    loading,
    loadUsers,
    openGenerateModal,
    selectedUser,
    users,
  } = useAuthorizationPinManager({
    allowed,
    user,
  });

  const columns = useMemo<ColumnsType<PinUserRecord>>(
    () =>
      createAuthorizationColumns({
        onDeactivatePin: handleDeactivatePin,
        onGeneratePin: openGenerateModal,
      }),
    [handleDeactivatePin, openGenerateModal],
  );
  const filteredUsers = useMemo(
    () => filterUsersBySearchTerm(users, searchTerm),
    [searchTerm, users],
  );
  const stats = useMemo(() => getAuthorizationStats(users), [users]);

  if (!allowed) {
    return (
      <Container>
        <MenuApp />
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
          visible={isGenerateModalVisible}
          onCancel={closeGenerateModal}
          onConfirm={handleConfirmGenerate}
          user={selectedUser}
          availableModules={AVAILABLE_MODULES}
        />

        <PinDetailsModal
          visible={isDetailsModalVisible}
          onClose={closeDetailsModal}
          pinData={generatedPin}
          user={selectedUser}
          currentUser={user}
        />
      </Content>
    </Container>
  );
};

export default AuthorizationConfig;
