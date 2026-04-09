import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';

import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { Nav } from '@/components/ui/Nav/Nav';
import {
  GeneralConfigSearch,
  GeneralConfigSearchTrigger,
} from './components/Search/GeneralConfigSearch';
import ROUTES_NAME from '@/router/routes/routesName';
import { useGeneralConfigController } from './hooks/useGeneralConfigController';

const SearchHighlightStyles = createGlobalStyle`
  [data-config-section] {
    scroll-margin-top: 120px;
  }

  .config-search-highlight {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 0;
    border-radius: 12px;
    box-shadow: var(--ds-shadow-focus);
    transition: box-shadow 0.25s ease;
  }
`;

export default function GeneralConfig() {
  const {
    activeItemKey,
    activeTab,
    blockedFallbackPath,
    canManageBusinessSettingsByRole,
    currentPath,
    handleBackClick,
    handleSearchEntrySelect,
    handleTabChange,
    hasAbilityData,
    menuItems,
    searchRecords,
    shouldBlockGeneralConfig,
  } = useGeneralConfigController();

  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const headerContent = (
    <MenuApp
      onBackClick={handleBackClick}
      sectionName="Configuración General"
    />
  );

  const sidebarSearch = (
    <GeneralConfigSearchTrigger onOpen={() => setSearchOpen(true)} />
  );

  if (!hasAbilityData && canManageBusinessSettingsByRole) {
    return null;
  }

  if (shouldBlockGeneralConfig) {
    const targetPath =
      blockedFallbackPath === currentPath
        ? ROUTES_NAME.BASIC_TERM.HOME
        : blockedFallbackPath;
    return <Navigate to={targetPath} replace />;
  }

  return (
    <>
      <SearchHighlightStyles />
      <GeneralConfigSearch
        isOpen={searchOpen}
        records={searchRecords}
        onSelect={handleSearchEntrySelect}
        onClose={() => setSearchOpen(false)}
        dependencyKey={currentPath}
      />
      <Nav
        menuItems={menuItems}
        activeTab={activeTab}
        activeItemKey={activeItemKey}
        onTabChange={handleTabChange}
        header={headerContent}
        sidebarHeader={sidebarSearch}
      >
        <Outlet />
      </Nav>
    </>
  );
}
