import type { Dispatch, ReactNode, SetStateAction } from 'react';

export interface LauncherShortcut {
  category: string;
  icon: ReactNode;
  key: string;
  route: string;
  title: string;
}

export type LauncherTabKey = 'user' | 'developer';

export interface LauncherTabDefinition {
  count: number;
  key: LauncherTabKey;
  label: string;
  panelId: string;
  tabId: string;
}

export interface ModuleShortcutsController {
  activeTabDefinition?: LauncherTabDefinition;
  canShowDeveloperTools: boolean;
  handleTogglePin: (shortcut: LauncherShortcut) => void;
  launcherTabs: LauncherTabDefinition[];
  pinnedKeys: string[];
  pinnedShortcuts: LauncherShortcut[];
  searchValue: string;
  selectedTab: LauncherTabKey;
  setActiveTab: Dispatch<SetStateAction<LauncherTabKey>>;
  setSearchValue: Dispatch<SetStateAction<string>>;
  shortcutGroups: [string, LauncherShortcut[]][];
}
