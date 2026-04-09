import styled from 'styled-components';

import type { AuthorizationRequest } from '../utils/authorizationsPanel';
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
  <AuthorizationsListContainer>
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
  </AuthorizationsListContainer>
);

export default AuthorizationsList;

const AuthorizationsListContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
`;
