import { Empty } from 'antd';
import styled from 'styled-components';

const EmptyState = ({ isAdmin }) => (
  <PanelContainer>
    <PanelHeader>
      <PanelTitle>Autorizaciones</PanelTitle>
    </PanelHeader>
    <EmptyContainer>
      <Empty
        description={isAdmin ? 'No hay solicitudes pendientes' : 'No tienes solicitudes pendientes'}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </EmptyContainer>
  </PanelContainer>
);

export default EmptyState;

const PanelContainer = styled.div`
  background: #ffffff;
  padding: 12px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  gap: 12px;
`;

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

const EmptyContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;
