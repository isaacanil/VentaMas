import { ClearOutlined, SaveOutlined } from '@/constants/icons/antd';
import { Button, Space } from 'antd';
import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
`;

interface ActionBarProps {
  isUpdateMode: boolean;
  submitting: boolean;
  onReset: () => void;
  onSubmit: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  isUpdateMode,
  submitting,
  onReset,
  onSubmit,
}) => (
  <Bar>
    <Space size="middle" wrap>
      <Button icon={<ClearOutlined />} onClick={onReset}>
        Limpiar
      </Button>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={onSubmit}
        loading={submitting}
      >
        {isUpdateMode ? 'Guardar cambios' : 'Crear producto'}
      </Button>
    </Space>
  </Bar>
);
