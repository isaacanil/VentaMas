import { Empty } from 'antd';
import styled from 'styled-components';

const EmptyState = ({ isAdmin }) => (
  <PanelContainer>
    <PanelHeader>
      <PanelTitle>Autorizaciones</PanelTitle>
    </PanelHeader>
    <EmptyContainer>
      <Empty
        description={
          isAdmin
            ? 'No hay solicitudes pendientes'
            : 'No tienes solicitudes pendientes'
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </EmptyContainer>
  </PanelContainer>
);

export default EmptyState;

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
`;

const PanelTitle = styled.h3`
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;
