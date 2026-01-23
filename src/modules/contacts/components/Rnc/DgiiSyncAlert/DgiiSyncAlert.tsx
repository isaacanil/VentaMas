import { SyncOutlined } from '@/constants/icons/antd';
import { Alert, Button, Popover, List, Tag, Space } from 'antd';
import styled from 'styled-components';

interface DgiiDifference {
  field: string;
  label: string;
  currentValue?: string | number | null;
  dgiiValue?: string | number | null;
}

interface DiffListProps {
  differences: DgiiDifference[];
}

interface DgiiSyncAlertProps {
  differences?: DgiiDifference[];
  onSync: () => void;
  loading?: boolean;
}

const DiffItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const ValueComparison = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
  font-size: 0.9em;
`;

const DiffList = ({ differences }: DiffListProps) => (
  <List
    size="small"
    dataSource={differences}
    renderItem={(diff: DgiiDifference) => (
      <DiffItem>
        <strong>{diff.label}</strong>
        <ValueComparison>
          <span>{diff.currentValue || '(vacío)'}</span>
          <SyncOutlined />
          <span>{diff.dgiiValue || '(vacío)'}</span>
        </ValueComparison>
      </DiffItem>
    )}
  />
);

export const DgiiSyncAlert = ({
  differences,
  onSync,
  loading,
}: DgiiSyncAlertProps) => {
  if (!differences?.length) return null;

  const content = (
    <div style={{ maxWidth: 300 }}>
      <DiffList differences={differences} />
    </div>
  );

  return (
    <Alert
      message={
        <Space>
          <span>Datos no sincronizados con DGII</span>
          <Popover
            title="Diferencias encontradas"
            content={content}
            trigger="click"
          >
            <Tag color="warning" style={{ cursor: 'pointer' }}>
              Ver diferencias
            </Tag>
          </Popover>
        </Space>
      }
      type="warning"
      showIcon
      action={
        <Button
          icon={<SyncOutlined spin={loading} />}
          onClick={onSync}
          loading={loading}
        >
          Sincronizar con DGII
        </Button>
      }
    />
  );
};
