import { Badge } from 'antd';
import styled from 'styled-components';

const AuthorizationsHeader = ({ pendingCount, isAdmin }) => (
  <PanelHeader>
    <PanelTitle>
      Autorizaciones
      {isAdmin && pendingCount > 0 && (
        <Badge count={pendingCount} style={{ marginLeft: 8 }} />
      )}
    </PanelTitle>
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
`;
