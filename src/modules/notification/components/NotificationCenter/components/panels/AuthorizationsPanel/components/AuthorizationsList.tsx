import type { AuthorizationRequest } from '../utils/authorizationsPanel';
import { ScrollArea } from '@/modules/notification/components/NotificationCenter/components/panels/shared/PanelPrimitives';
import AuthorizationRow from './AuthorizationRow';

interface AuthorizationsListProps {
  authorizations: AuthorizationRequest[];
  isAdmin: boolean;
  processingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const AuthorizationsList = ({
  authorizations,
  isAdmin,
  processingId,
  onApprove,
  onReject,
}: AuthorizationsListProps) => (
  <ScrollArea>
    {authorizations.map((authorization) => (
      <AuthorizationRow
        key={authorization.id}
        auth={authorization}
        isAdmin={isAdmin}
        processingId={processingId}
        onApprove={onApprove}
        onReject={onReject}
      />
    ))}
  </ScrollArea>
);

export default AuthorizationsList;
