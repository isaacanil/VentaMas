import { ClearOutlined, SaveOutlined, CloseOutlined } from '@/constants/icons/antd';
import { Button, Space } from 'antd';
import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

interface ActionBarProps {
  isUpdateMode: boolean;
  submitting: boolean;
  onReset: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  isUpdateMode,
  submitting,
  onReset,
  onSubmit,
  onCancel,
}) => (
  <Bar>
    <Button icon={<ClearOutlined />} onClick={onReset}>
      Limpiar
    </Button>
    <Space size="middle" wrap>
      <Button icon={<CloseOutlined />} onClick={onCancel}>
        Salir
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
