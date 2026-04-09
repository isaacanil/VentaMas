import { createContext, useContext } from 'react';
import type { MenuAppUIProps } from '@/modules/navigation/components/MenuApp/MenuApp';

export type DashboardMenuConfig = MenuAppUIProps;

export interface DashboardMenuContextValue {
  setMenuConfig: (config: DashboardMenuConfig) => void;
  clearMenuConfig: () => void;
}

const DashboardMenuContext = createContext<DashboardMenuContextValue | null>(
  null,
);

export const DashboardMenuProvider = DashboardMenuContext.Provider;

export const useDashboardMenu = (): DashboardMenuContextValue | null =>
  useContext(DashboardMenuContext);
