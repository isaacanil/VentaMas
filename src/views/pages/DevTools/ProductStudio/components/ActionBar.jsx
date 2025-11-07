import { ClearOutlined, EyeInvisibleOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const ModeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: ${props => props.$isUpdate ? '#f8f9fa' : '#f8f9fa'};
  color: ${props => props.$isUpdate ? '#495057' : '#495057'};
  border: 1px solid ${props => props.$isUpdate ? '#dee2e6' : '#dee2e6'};
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.$isUpdate ? '#6366f1' : '#10b981'};
  }
`;

export const ActionBar = ({
  isUpdateMode,
  productId,
  submitting,
  onReset,
  onSubmit,
  navigationVisible,
  summaryVisible,
  onToggleNavigation,
  onToggleSummary,
}) => (
  <Bar>
    <ModeBadge $isUpdate={isUpdateMode}>
      {isUpdateMode ? 'Editando' : 'Creando'}
    </ModeBadge>
    <Space size="small" wrap>
      <Button
        icon={navigationVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        onClick={onToggleNavigation}
        aria-label="Alternar navegación"
      >
        Navegación
      </Button>
      <Button
        icon={summaryVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        onClick={onToggleSummary}
        aria-label="Alternar resumen"
      >
        Resumen
      </Button>
    </Space>
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
