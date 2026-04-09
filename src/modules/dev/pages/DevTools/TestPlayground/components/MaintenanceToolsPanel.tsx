import { Button, Input, Space, Switch, Typography } from 'antd';
import type { ChangeEvent } from 'react';

import {
  ClientNormalizationResultAlert,
  ExpenseTimestampResultAlert,
  ProductFixResultAlert,
  TaxNormalizationResultAlert,
} from './ResultAlerts';
import type { TestPlaygroundState } from '../types';

const { Text } = Typography;

interface MaintenanceToolsPanelProps {
  state: TestPlaygroundState;
  resolvedProductFixBusinessId: string;
  resolvedExpenseFixBusinessId: string;
  onNormalizeTaxes: () => void;
  onNormalizeClients: () => void;
  onFixProductIds: () => void;
  onProductBusinessIdChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onExpenseBusinessIdChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleAllBusinesses: (value: boolean) => void;
  onExpenseTimestampFix: (dryRun: boolean) => void;
}

export const MaintenanceToolsPanel = ({
  state,
  resolvedProductFixBusinessId,
  resolvedExpenseFixBusinessId,
  onNormalizeTaxes,
  onNormalizeClients,
  onFixProductIds,
  onProductBusinessIdChange,
  onExpenseBusinessIdChange,
  onToggleAllBusinesses,
  onExpenseTimestampFix,
}: MaintenanceToolsPanelProps) => {
  const {
    normalizing,
    progress,
    result,
    clientNormalizationState,
    productIdFixState,
    expenseTimestampFixState,
    applyToAllBusinesses,
  } = state;

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Space size="middle" wrap>
        <Button type="primary" onClick={onNormalizeTaxes} loading={normalizing}>
          Normalizar ITBIS para todos los negocios
        </Button>
        {progress && (
          <Text type="secondary">
            Procesando negocio {progress.processed}/{progress.total}
            {progress.businessID ? ` · Ultimo: ${progress.businessID}` : ''}
          </Text>
        )}
      </Space>
      <TaxNormalizationResultAlert result={result} />

      <Space size="middle" wrap>
        <Button
          onClick={onNormalizeClients}
          loading={clientNormalizationState.running}
        >
          Normalizar clientes (estructura/pendingBalance)
        </Button>
        {clientNormalizationState.progress && (
          <Text type="secondary">
            Procesando negocio {clientNormalizationState.progress.processed}/
            {clientNormalizationState.progress.total}
            {clientNormalizationState.progress.businessID
              ? ` · Ultimo: ${clientNormalizationState.progress.businessID}`
              : ''}
            {clientNormalizationState.progress.normalized !== null
              ? ` · Ajustados: ${clientNormalizationState.progress.normalized}`
              : ''}
          </Text>
        )}
      </Space>
      <ClientNormalizationResultAlert
        result={clientNormalizationState.result}
      />

      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
        <Text strong>Corregir campo `id` en productos</Text>
        <Space size="middle" wrap>
          <Input
            placeholder="businessID"
            value={resolvedProductFixBusinessId}
            onChange={onProductBusinessIdChange}
            style={{ minWidth: 260 }}
          />
          <Button onClick={onFixProductIds} loading={productIdFixState.running}>
            Asignar IDs faltantes
          </Button>
        </Space>
        <ProductFixResultAlert result={productIdFixState.result} />
      </Space>

      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
        <Text strong>Normalizar timestamps de gastos</Text>
        <Space size="middle" wrap>
          <Input
            placeholder="businessID"
            value={resolvedExpenseFixBusinessId}
            onChange={onExpenseBusinessIdChange}
            disabled={applyToAllBusinesses}
            style={{ minWidth: 260 }}
          />
          <Switch
            checked={applyToAllBusinesses}
            onChange={onToggleAllBusinesses}
            checkedChildren="Todos los negocios"
            unCheckedChildren="Solo este negocio"
          />
          <Button
            onClick={() => onExpenseTimestampFix(true)}
            loading={expenseTimestampFixState.running}
          >
            Detectar inconsistencias
          </Button>
          <Button
            type="primary"
            onClick={() => onExpenseTimestampFix(false)}
            loading={expenseTimestampFixState.running}
          >
            Convertir a Timestamp real
          </Button>
        </Space>
        <ExpenseTimestampResultAlert result={expenseTimestampFixState.result} />
      </Space>
    </Space>
  );
};
