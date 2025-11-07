import styled from 'styled-components';

export const PageContainer = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  min-height: 100vh;
  height: 100%;
  background: #ffffffff;
  overflow: hidden;
`;

export const Workspace = styled.div`
  display: grid;
  grid-template-columns: ${({ $showNavigator }) => ($showNavigator ? '200px 1fr' : '1fr')};
  min-height: 0;
  height: 100%;
  background: #fff;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

export const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  position: relative;
  height: 100%;
`;

export const StudioWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  padding-bottom: 120px;
`;

export const StudioGrid = styled.div`
  display: grid;
  grid-template-columns: ${({ $showSummary }) => ($showSummary ? 'minmax(0, 1fr) minmax(320px, min-content)' : '1fr')};
  gap: 24px;
  width: 100%;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const StickySummary = styled.div`
  padding: 0px 8px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 1200px) {
    padding: 0;
  }
`;
