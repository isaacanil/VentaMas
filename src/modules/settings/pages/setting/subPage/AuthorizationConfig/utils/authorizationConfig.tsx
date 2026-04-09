import {
  ReloadOutlined,
  StopOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
} from '@/constants/icons/antd';
import { Button, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ModulePinDetail } from '@/firebase/authorization/pinAuth';

import type {
  AuthorizationModuleOption,
  PinUserRecord,
} from '../types';

const { Text } = Typography;

export const AVAILABLE_MODULES: AuthorizationModuleOption[] = [
  { value: 'invoices', label: 'Facturación' },
  { value: 'accountsReceivable', label: 'Cuentas por Cobrar' },
];

const MODULE_LABELS = AVAILABLE_MODULES.reduce<Record<string, string>>(
  (acc, item) => {
    acc[item.value] = item.label;
    return acc;
  },
  {},
);

const ROLE_COLORS: Record<string, string> = {
  admin: 'blue',
  owner: 'purple',
  manager: 'cyan',
  cashier: 'default',
};

const renderModuleDetails = (record: PinUserRecord) => {
  const entries = record.moduleDetails
    ? (Object.entries(record.moduleDetails) as Array<[string, ModulePinDetail]>)
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

export const getStatusTag = (userRecord: PinUserRecord) => {
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

export const filterUsersBySearchTerm = (
  users: PinUserRecord[],
  searchTerm: string,
) => {
  const normalizedTerm = searchTerm.trim().toLowerCase();
  if (!normalizedTerm) {
    return users;
  }

  return users.filter((user) => {
    return (
      user.name.toLowerCase().includes(normalizedTerm) ||
      user.displayName.toLowerCase().includes(normalizedTerm) ||
      user.role.toLowerCase().includes(normalizedTerm)
    );
  });
};

export const getAuthorizationStats = (users: PinUserRecord[]) => ({
  total: users.length,
  withPin: users.filter((user) => user.hasPin).length,
  active: users.filter((user) => user.pinIsActive).length,
  expired: users.filter((user) => user.pinIsExpired).length,
});

interface CreateAuthorizationColumnsArgs {
  onDeactivatePin: (userId: string, userName: string) => void;
  onGeneratePin: (userRecord: PinUserRecord) => void;
}

export const createAuthorizationColumns = ({
  onDeactivatePin,
  onGeneratePin,
}: CreateAuthorizationColumnsArgs): ColumnsType<PinUserRecord> => [
  {
    title: 'Usuario',
    dataIndex: 'name',
    key: 'name',
    render: (text: string, record) => (
      <div>
        <div style={{ fontWeight: 500 }}>{record.displayName}</div>
        <div style={{ fontSize: '0.85em', color: '#888' }}>{text || '-'}</div>
      </div>
    ),
  },
  {
    title: 'Rol',
    dataIndex: 'role',
    key: 'role',
    render: (role: string) => (
      <Tag color={ROLE_COLORS[role] || 'default'}>{role}</Tag>
    ),
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
    render: (date: Date | null, record) => {
      if (!date) return '-';
      if (record.pinIsExpired) {
        return <Text type="danger">Expirado</Text>;
      }

      const now = Date.now();
      const hoursLeft = Math.round((date.getTime() - now) / (1000 * 60 * 60));
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
          onClick={() => onGeneratePin(record)}
        >
          {record.hasPin ? 'Regenerar' : 'Generar'}
        </Button>
        {record.hasPin && record.pinIsActive && (
          <Button
            danger
            size="small"
            icon={<StopOutlined />}
            onClick={() => onDeactivatePin(record.id, record.displayName)}
          >
            Desactivar
          </Button>
        )}
      </Space>
    ),
  },
];
