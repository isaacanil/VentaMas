import { Skeleton } from 'antd';
import type { ReactNode } from 'react';
import styled from 'styled-components';

interface AccountingWorkspaceShellProps {
  children: ReactNode;
  loading?: boolean;
  navigation: ReactNode;
  notices?: ReactNode;
}

export const AccountingWorkspaceShell = ({
  children,
  loading = false,
  navigation,
  notices,
}: AccountingWorkspaceShellProps) => (
  <Shell>
    {notices ? <NoticeStack>{notices}</NoticeStack> : null}

    <WorkspaceSurface>
      <NavigationSurface>{navigation}</NavigationSurface>
      <BodySurface>
        {loading ? (
          <LoadingState>
            <LoadingCopy>Preparando datos del modulo contable...</LoadingCopy>
            <Skeleton active paragraph={{ rows: 8 }} />
          </LoadingState>
        ) : (
          children
        )}
      </BodySurface>
    </WorkspaceSurface>
  </Shell>
);

const Shell = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  width: min(100%, 1200px);
  margin: 0 auto;
`;

const NoticeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
`;

const WorkspaceSurface = styled.section`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const NavigationSurface = styled.div`
  border-bottom: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
`;

const BodySurface = styled.div`
  padding: 0 var(--ds-space-5);
  background: var(--ds-color-bg-surface);

  @media (max-width: 720px) {
    padding: 0 var(--ds-space-4);
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-6) 0;
`;

const LoadingCopy = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;
