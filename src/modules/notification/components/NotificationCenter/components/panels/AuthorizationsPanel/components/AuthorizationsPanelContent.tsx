import type { AuthorizationRequest } from '../utils/authorizationsPanel';
import { PanelCard } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';
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
  <PanelCard>
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
  </PanelCard>
);

export default AuthorizationsPanelContent;
