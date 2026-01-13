// @ts-nocheck
import { Button } from 'antd';
import styled from 'styled-components';

export const UserActivityHeader = ({ onBack, onRefresh, loading }) => (
  <Header>
    <TitleBlock>
      <Title>Actividad del usuario</Title>
      <Subtitle>
        Historial de accesos y conexiones recientes para el usuario.
      </Subtitle>
    </TitleBlock>
    <Actions>
      <Button onClick={onBack}>Volver</Button>
      <Button type="primary" onClick={onRefresh} loading={loading}>
        Actualizar
      </Button>
    </Actions>
  </Header>
);

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: ${({ theme }) => theme?.palette?.text?.primary || '#1f1f1f'};
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme?.palette?.text?.secondary || '#4b5563'};
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;
