import { Spin } from 'antd';
import styled from 'styled-components';

const LoadingState = () => (
  <PanelContainer>
    <PanelHeader>
      <PanelTitle>Autorizaciones</PanelTitle>
    </PanelHeader>
    <LoadingContainer>
      <Spin />
    </LoadingContainer>
  </PanelContainer>
);

export default LoadingState;

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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 40px;
`;
