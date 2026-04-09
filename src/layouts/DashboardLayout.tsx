import { Suspense, useMemo, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

import {
  DashboardMenuProvider,
  type DashboardMenuConfig,
} from './dashboardMenuContext';
import { MenuAppUI } from '@/modules/navigation/components/MenuApp/MenuApp';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const PageFallback = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 50vh;
  gap: 12px;
  color: var(--color-primary, #667eea);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-size: 0.8rem;
`;

const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border: 3px solid rgb(102 126 234 / 15%);
  border-top-color: var(--color-primary, #667eea);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const LayoutShell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

const Content = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
`;

export const DashboardLayout = () => {
  const [menuConfig, setMenuConfig] = useState<DashboardMenuConfig | null>(
    null,
  );
  const clearMenuConfig = useCallback(() => setMenuConfig(null), []);

  const contextValue = useMemo(
    () => ({
      setMenuConfig,
      clearMenuConfig,
    }),
    [clearMenuConfig, setMenuConfig],
  );

  return (
    <DashboardMenuProvider value={contextValue}>
      <LayoutShell>
        {menuConfig ? <MenuAppUI {...menuConfig} /> : null}
        <Content>
          <Suspense
            fallback={
              <PageFallback>
                <Spinner />
                Cargando...
              </PageFallback>
            }
          >
            <Outlet />
          </Suspense>
        </Content>
      </LayoutShell>
    </DashboardMenuProvider>
  );
};

export default DashboardLayout;
