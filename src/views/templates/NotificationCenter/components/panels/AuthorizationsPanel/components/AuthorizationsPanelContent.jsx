import styled from 'styled-components';

import AuthorizationsHeader from './AuthorizationsHeader';
import AuthorizationsList from './AuthorizationsList';

const AuthorizationsPanelContent = ({
  authorizations,
  pendingCount,
  isAdmin,
  processingId,
  onApprove,
  onReject,
  onNavigateToRequests,
}) => (
  <PanelContainer>
    <AuthorizationsHeader
      pendingCount={pendingCount}
      isAdmin={isAdmin}
      onNavigate={onNavigateToRequests}
    />
    <AuthorizationsList
      authorizations={authorizations}
      isAdmin={isAdmin}
      processingId={processingId}
      onApprove={onApprove}
      onReject={onReject}
    />
  </PanelContainer>
);

export default AuthorizationsPanelContent;

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
`;
