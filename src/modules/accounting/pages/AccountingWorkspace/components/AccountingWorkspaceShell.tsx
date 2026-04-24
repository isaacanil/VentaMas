import { Skeleton } from 'antd';
import type { ReactNode } from 'react';
import styled from 'styled-components';

interface AccountingWorkspaceShellProps {
  children: ReactNode;
  loading?: boolean;
  navigation?: ReactNode;
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
      {navigation ? <NavigationSurface>{navigation}</NavigationSurface> : null}
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
  width: 100%;
`;

const NoticeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
`;

const WorkspaceSurface = styled.section`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const NavigationSurface = styled.div`
  border-bottom: 1px solid var(--ds-color-border-default);
`;

const BodySurface = styled.div`
  min-width: 0;
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
