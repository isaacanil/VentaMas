import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import {
  useDeveloperFeaturesData,
  useMenuCardData,
} from '@/modules/home/pages/Home/CardData';

import {
  CATEGORY_ORDER,
  MAX_PINNED_SHORTCUTS,
  getInitialPinnedKeys,
  normalizeSearch,
  normalizeShortcuts,
  uniqueShortcutsByRoute,
} from './moduleLauncherUtils';

import type { Dispatch, SetStateAction } from 'react';
import type {
  LauncherShortcut,
  LauncherTabDefinition,
  LauncherTabKey,
  ModuleShortcutsController,
} from './types';

interface UseModuleShortcutsOptions {
  activeTab?: LauncherTabKey;
  includeDeveloperFeatures?: boolean;
  onActiveTabChange?: Dispatch<SetStateAction<LauncherTabKey>>;
  onSearchValueChange?: Dispatch<SetStateAction<string>>;
  searchValue?: string;
}

export const useModuleShortcuts = ({
  activeTab: controlledActiveTab,
  includeDeveloperFeatures = false,
  onActiveTabChange,
  onSearchValueChange,
  searchValue: controlledSearchValue,
}: UseModuleShortcutsOptions = {}): ModuleShortcutsController => {
  const user = useSelector(selectUser);
  const menuShortcuts = normalizeShortcuts(useMenuCardData(user));
  const developerShortcuts = normalizeShortcuts(useDeveloperFeaturesData());
  const { abilities } = useUserAccess();
  const canShowDeveloperTools = Boolean(
    includeDeveloperFeatures && abilities?.can('developerAccess', 'all'),
  );
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const [internalActiveTab, setInternalActiveTab] =
    useState<LauncherTabKey>('user');
  const [customPinnedKeys, setCustomPinnedKeys] = useState<string[] | null>(
    null,
  );
  const searchValue = controlledSearchValue ?? internalSearchValue;
  const setSearchValue = onSearchValueChange ?? setInternalSearchValue;
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = onActiveTabChange ?? setInternalActiveTab;

  const userShortcuts = useMemo(
    () => uniqueShortcutsByRoute(menuShortcuts),
    [menuShortcuts],
  );
  const developerOnlyShortcuts = useMemo(
    () =>
      canShowDeveloperTools ? uniqueShortcutsByRoute(developerShortcuts) : [],
    [canShowDeveloperTools, developerShortcuts],
  );
  const selectedTab: LauncherTabKey =
    canShowDeveloperTools && activeTab === 'developer' ? 'developer' : 'user';
  const launcherTabs = useMemo<LauncherTabDefinition[]>(() => {
    const tabs: LauncherTabDefinition[] = [
      {
        count: userShortcuts.length,
        key: 'user',
        label: 'Usuario',
        panelId: 'module-launcher-user-panel',
        tabId: 'module-launcher-user-tab',
      },
    ];

    if (canShowDeveloperTools) {
      tabs.push({
        count: developerOnlyShortcuts.length,
        key: 'developer',
        label: 'Desarrollador',
        panelId: 'module-launcher-developer-panel',
        tabId: 'module-launcher-developer-tab',
      });
    }

    return tabs;
  }, [
    canShowDeveloperTools,
    developerOnlyShortcuts.length,
    userShortcuts.length,
  ]);
  const activeTabDefinition = useMemo(
    () =>
      launcherTabs.find((tab) => tab.key === selectedTab) ?? launcherTabs[0],
    [launcherTabs, selectedTab],
  );
  const activeShortcuts =
    selectedTab === 'developer' ? developerOnlyShortcuts : userShortcuts;

  const defaultPinnedKeys = useMemo(
    () => getInitialPinnedKeys(userShortcuts),
    [userShortcuts],
  );
  const userShortcutKeys = useMemo(
    () => new Set(userShortcuts.map((shortcut) => shortcut.key)),
    [userShortcuts],
  );
  const pinnedKeys = useMemo(
    () =>
      (customPinnedKeys ?? defaultPinnedKeys)
        .filter((key) => userShortcutKeys.has(key))
        .slice(0, MAX_PINNED_SHORTCUTS),
    [customPinnedKeys, defaultPinnedKeys, userShortcutKeys],
  );
  const pinnedShortcuts = useMemo(() => {
    const byKey = new Map(
      userShortcuts.map((shortcut) => [shortcut.key, shortcut]),
    );
    return pinnedKeys
      .map((key) => byKey.get(key))
      .filter((shortcut): shortcut is LauncherShortcut => Boolean(shortcut))
      .slice(0, MAX_PINNED_SHORTCUTS);
  }, [pinnedKeys, userShortcuts]);

  const normalizedQuery = normalizeSearch(searchValue);
  const visibleShortcuts = useMemo(() => {
    const source = normalizedQuery
      ? activeShortcuts.filter((shortcut) =>
          normalizeSearch(
            `${shortcut.title} ${shortcut.category} ${shortcut.route}`,
          ).includes(normalizedQuery),
        )
      : activeShortcuts;

    return [...source].sort((left, right) => {
      const categoryDelta =
        (CATEGORY_ORDER[left.category] ?? 100) -
        (CATEGORY_ORDER[right.category] ?? 100);
      return categoryDelta || left.title.localeCompare(right.title, 'es');
    });
  }, [activeShortcuts, normalizedQuery]);

  const shortcutGroups = useMemo(() => {
    const groups = new Map<string, LauncherShortcut[]>();

    visibleShortcuts.forEach((shortcut) => {
      const group = groups.get(shortcut.category) ?? [];
      group.push(shortcut);
      groups.set(shortcut.category, group);
    });

    return Array.from(groups.entries()).sort(
      ([leftCategory], [rightCategory]) =>
        (CATEGORY_ORDER[leftCategory] ?? 100) -
        (CATEGORY_ORDER[rightCategory] ?? 100),
    );
  }, [visibleShortcuts]);

  const handleTogglePin = useCallback(
    (shortcut: LauncherShortcut) => {
      setCustomPinnedKeys((current) => {
        const base = (current ?? defaultPinnedKeys).filter((key) =>
          userShortcutKeys.has(key),
        );
        if (base.includes(shortcut.key)) {
          return base.filter((key) => key !== shortcut.key);
        }

        if (base.length >= MAX_PINNED_SHORTCUTS) {
          return base;
        }

        return [shortcut.key, ...base].slice(0, MAX_PINNED_SHORTCUTS);
      });
    },
    [defaultPinnedKeys, userShortcutKeys],
  );

  return {
    activeTabDefinition,
    canShowDeveloperTools,
    handleTogglePin,
    launcherTabs,
    pinnedKeys,
    pinnedShortcuts,
    searchValue,
    selectedTab,
    setActiveTab,
    setSearchValue,
    shortcutGroups,
  };
};
