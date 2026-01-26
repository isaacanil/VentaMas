import styled from 'styled-components';

interface WorkspaceProps {
  $showNavigator: boolean;
}

interface StudioGridProps {
  $showSummary: boolean;
}

export const PageContainer = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #ffff;
`;

export const Workspace = styled.div<WorkspaceProps>`
  display: grid;
  grid-template-columns: ${({ $showNavigator }) =>
    $showNavigator ? '200px 1fr' : '1fr'};
  height: 100%;
  min-height: 0;
  background: #fff;

  @media (width <= 992px) {
    grid-template-columns: 1fr;
  }
`;

export const ScrollArea = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
`;

export const StudioWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  padding-bottom: 120px;
`;

export const StudioGrid = styled.div<StudioGridProps>`
  display: grid;
  grid-template-columns: ${({ $showSummary }) =>
    $showSummary ? 'minmax(0, 1fr) minmax(320px, min-content)' : '1fr'};
  gap: 24px;
  width: 100%;

  @media (width <= 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const StickySummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 8px 12px 0;

  @media (width <= 1200px) {
    display: none;
    padding: 0;
  }
`;
