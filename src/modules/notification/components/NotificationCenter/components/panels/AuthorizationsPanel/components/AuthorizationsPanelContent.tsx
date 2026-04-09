import styled from 'styled-components';

import type { AuthorizationRequest } from '../utils/authorizationsPanel';
import AuthorizationsHeader from './AuthorizationsHeader';
import AuthorizationsList from './AuthorizationsList';

interface AuthorizationsPanelContentProps {
  authorizations: AuthorizationRequest[];
  pendingCount: number;
  isAdmin: boolean;
  processingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onNavigateToRequests: () => void;
}

const AuthorizationsPanelContent = ({
  authorizations,
  pendingCount,
  isAdmin,
  processingId,
  onApprove,
  onReject,
  onNavigateToRequests,
}: AuthorizationsPanelContentProps) => (
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
