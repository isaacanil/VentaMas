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
}) => (
  <PanelContainer>
    <AuthorizationsHeader pendingCount={pendingCount} isAdmin={isAdmin} />
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
  background: #ffffff;
  padding: 12px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  gap: 12px;
`;
