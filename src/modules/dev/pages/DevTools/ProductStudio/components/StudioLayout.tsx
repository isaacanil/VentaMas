import styled from 'styled-components';
import { PageLayout } from '@/components/layout/PageShell';

interface WorkspaceProps {
  $showNavigator: boolean;
}

interface StudioGridProps {
  $showSummary: boolean;
}

export const PageContainer = styled(PageLayout)`
  background: #fff;
`;

export const Workspace = styled.div<WorkspaceProps>`
  display: grid;
  grid-template-columns: ${({ $showNavigator }) =>
    $showNavigator ? '200px 1fr' : '1fr'};
  grid-template-rows: 1fr;
  flex: 1 1 auto;
  min-height: 0;
  background: #fff;

  @media (width <= 992px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }
`;

export const DesktopSidebar = styled.div`
  display: block;
  height: 100%;
  
  @media (width <= 992px) {
    display: none;
  }
`;

export const MobileBottomNav = styled.div`
  display: none;

  @media (width <= 992px) {
    display: block;
    margin-bottom: 12px;
  }
`;

export const ScrollArea = styled.div`
  position: relative;
  min-height: 0;
  overflow-y: auto;
`;

export const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
`;

export const StickyActionBar = styled.div`
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
  z-index: 10;
`;

export const StudioWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  padding-bottom: 48px;
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
