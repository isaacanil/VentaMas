import { RightOutlined } from '@/constants/icons/antd';
import { Badge } from 'antd';
import styled from 'styled-components';

import {
  PanelHeader as PanelHeaderContainer,
  PanelTitle,
} from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';

const AuthorizationsHeader = ({ pendingCount, isAdmin, onNavigate }) => (
  <PanelHeaderContainer>
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
  </PanelHeaderContainer>
);

export default AuthorizationsHeader;

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
