import { ClearOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
`;

export const ActionBar = ({ isUpdateMode, submitting, onReset, onSubmit }) => (
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
