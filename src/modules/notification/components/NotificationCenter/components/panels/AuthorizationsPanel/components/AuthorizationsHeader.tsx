import { RightOutlined } from '@/constants/icons/antd';
import { Badge } from 'antd';
import styled from 'styled-components';

const AuthorizationsHeader = ({ pendingCount, isAdmin, onNavigate }) => (
  <PanelHeader>
    <PanelTitle>
      Autorizaciones
      {isAdmin && pendingCount > 0 && (
        <Badge count={pendingCount} style={{ marginLeft: '8px' }} />
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
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
`;

const PanelTitle = styled.h3`
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const NavigateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #1d4ed8;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #1d4ed8;
    background: #eff6ff;
    border-color: #93c5fd;
  }

  &:active {
    transform: translateY(1px);
  }
`;
