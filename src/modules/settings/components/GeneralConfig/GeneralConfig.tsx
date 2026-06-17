import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { MenuApp } from '@/modules/navigation/public';
import ROUTES_NAME from '@/router/routes/routesName';

import { GeneralConfigNav } from './components/GeneralConfigNav/GeneralConfigNav';
import {
  GeneralConfigSearch,
  GeneralConfigSearchTrigger,
} from './components/Search/GeneralConfigSearch';
import { SearchHighlightStyles } from './GeneralConfig.styles';
import { useGeneralConfigController } from './hooks/useGeneralConfigController';

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
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen((current) => !current);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const headerContent = (
    <MenuApp
      onBackClick={handleBackClick}
      sectionName="Configuracion General"
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
      <GeneralConfigNav
        menuItems={menuItems}
        activeTab={activeTab}
        activeItemKey={activeItemKey}
        onTabChange={handleTabChange}
        header={headerContent}
        sidebarHeader={sidebarSearch}
      >
        <Outlet />
      </GeneralConfigNav>
    </>
  );
}
