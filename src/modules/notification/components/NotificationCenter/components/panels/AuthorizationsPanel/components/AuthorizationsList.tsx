import styled from 'styled-components';

import AuthorizationRow from './AuthorizationRow';

const AuthorizationsList = ({
  authorizations,
  isAdmin,
  processingId,
  onApprove,
  onReject,
}) => (
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
