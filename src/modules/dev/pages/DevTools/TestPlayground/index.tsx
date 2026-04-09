import { Alert, Tabs, Typography } from 'antd';
import type { TabsProps } from 'antd';

import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { MaintenanceToolsPanel } from './components/MaintenanceToolsPanel';
import { useTestPlaygroundController } from './hooks/useTestPlaygroundController';
import SessionTokensCleanup from '../test/pages/sessionTokensCleanup/SessionTokensCleanup';

const { Title, Paragraph, Text } = Typography;

export default function TestPlayground() {
  const {
    state,
    resolvedProductFixBusinessId,
    resolvedExpenseFixBusinessId,
    handleNormalizeTaxes,
    handleNormalizeClients,
    handleFixProductIds,
    handleBusinessIdChange,
    handleExpenseTimestampBusinessChange,
    handleExpenseTimestampFix,
    setApplyToAllBusinesses,
  } = useTestPlaygroundController();

  const tabItems: TabsProps['items'] = [
    {
      key: 'maintenance-tools',
      label: 'Herramientas de normalizacion',
      children: (
        <MaintenanceToolsPanel
          state={state}
          resolvedProductFixBusinessId={resolvedProductFixBusinessId}
          resolvedExpenseFixBusinessId={resolvedExpenseFixBusinessId}
          onNormalizeTaxes={handleNormalizeTaxes}
          onNormalizeClients={handleNormalizeClients}
          onFixProductIds={handleFixProductIds}
          onProductBusinessIdChange={handleBusinessIdChange}
          onExpenseBusinessIdChange={handleExpenseTimestampBusinessChange}
          onToggleAllBusinesses={setApplyToAllBusinesses}
          onExpenseTimestampFix={handleExpenseTimestampFix}
        />
      ),
    },
    {
      key: 'session-token-cleanup',
      label: 'SessionTokens',
      children: <SessionTokensCleanup />,
    },
  ];

  return (
    <>
      <MenuApp sectionName="Zona de pruebas" />
      <div style={{ padding: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          Zona de pruebas
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Usa este espacio para validar integraciones, componentes o flujos en
          desarrollo. Los accesos visibles aqui son temporales y pueden cambiar
          sin previo aviso.
        </Paragraph>
        <Alert
          type="info"
          showIcon
          message="Recomendacion"
          description={
            <Text>
              Registra brevemente los objetivos de la prueba y elimina cualquier
              estado temporal una vez concluido para evitar confusiones en el
              equipo.
            </Text>
          }
          style={{ marginBottom: 24 }}
        />
        <Tabs
          defaultActiveKey="maintenance-tools"
          items={tabItems}
          destroyInactiveTabPane={false}
        />
      </div>
    </>
  );
}
