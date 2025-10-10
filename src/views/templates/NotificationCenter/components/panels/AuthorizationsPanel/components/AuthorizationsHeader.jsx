import { RightOutlined } from '@ant-design/icons';
import { Badge } from 'antd';
import styled from 'styled-components';

const AuthorizationsHeader = ({ pendingCount, isAdmin, onNavigate }) => (
  <PanelHeader>
    <PanelTitle>
      Autorizaciones
      {isAdmin && pendingCount > 0 && (
        <Badge count={pendingCount} style={{ marginLeft: 8 }} />
      )}
    </PanelTitle>
    {isAdmin && typeof onNavigate === 'function' && (
      <NavigateButton
        type="button"
        onClick={onNavigate}
        aria-label="Abrir solicitudes de autorización"
      >
        <RightOutlined />
      </NavigateButton>
    )}
  </PanelHeader>
);

export default AuthorizationsHeader;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const PanelTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavigateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #1d4ed8;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #1d4ed8;
  }

  &:active {
    transform: translateY(1px);
  }
`;
