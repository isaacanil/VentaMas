import { Tag } from 'antd';
import styled from 'styled-components';

export const UserInfoCard = ({
  name,
  roleLabel,
  active,
  statusTag,
  statusLabel,
  lastSeenLabel,
}) => (
  <UserCard>
    <UserInfo>
      <h3>{name}</h3>
      <Tags>
        {roleLabel && <Tag>{roleLabel}</Tag>}
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Activo' : 'Inactivo'}
        </Tag>
        <Tag color={statusTag}>{statusLabel}</Tag>
      </Tags>
    </UserInfo>
    <PresenceInfo>
      <Label>Ultima conexion</Label>
      <Value>{lastSeenLabel}</Value>
    </PresenceInfo>
  </UserCard>
);

const UserCard = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  padding: 1rem;
  background: ${({ theme }) => theme?.bg?.primary || '#fff'};
  border: 1px solid
    ${({ theme }) => theme?.border?.primary || 'rgba(0,0,0,0.06)'};
  border-radius: 12px;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme?.palette?.text?.secondary || '#4b5563'};
  }
`;

const Tags = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.35rem;
`;

const PresenceInfo = styled.div`
  display: grid;
  gap: 0.35rem;
  align-content: center;
`;

const Label = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme?.palette?.text?.secondary || '#4b5563'};
`;

const Value = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme?.palette?.text?.primary || '#111827'};
`;
