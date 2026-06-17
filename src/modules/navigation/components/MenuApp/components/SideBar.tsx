import { m } from 'framer-motion';
import React, {
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import type { MenuItem } from '@/types/menu';
import type { UserIdentity } from '@/types/users';

import { icons } from '@/constants/icons/icons';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import ROUTES_PATH from '@/router/routes/routesName';
import { useHasDeveloperAccess } from '@/modules/navigation/utils/menuAccess';
import { useMenuData } from '@/modules/navigation/components/MenuApp/MenuData/MenuData';
import {
  filterGroupedMenuByQuery,
  type MenuSearchItem,
} from '@/modules/navigation/components/MenuApp/utils/menuSearch';
import { UserSection } from '@/modules/navigation/components/MenuApp/UserSection';
import { closeMenu } from '@/modules/navigation/state/navSlice';
import { ButtonIconMenu } from '@/components/ui/Button';

import { openNotificationCenter } from '../../../state/notificationCenterSlice';
import { MenuLink } from './MenuLink';
import { OpenMenuButton } from './OpenMenuButton/OpenMenuButton';
import { SidebarSearch } from './SidebarSearch/SidebarSearch';
import { WebName } from './WebName/WebName';

const SIDEBAR_VARIANTS = {
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 450,
      damping: 50,
      restDelta: 2,
    },
  },
  closed: {
    x: '-100%',
    transition: {
      type: 'spring',
      stiffness: 450,
      damping: 50,
      restDelta: 2,
    },
  },
};

const { ACCOUNTING_TERM, SALES_TERM } = ROUTES_PATH;
const DEV_PREFETCH_ROUTES = new Set<string>([
  SALES_TERM.SALES,
  SALES_TERM.BILLS,
  ACCOUNTING_TERM.ACCOUNTING,
  ACCOUNTING_TERM.ACCOUNTING_JOURNAL_BOOK,
  ACCOUNTING_TERM.ACCOUNTING_GENERAL_LEDGER,
  ACCOUNTING_TERM.ACCOUNTING_MANUAL_ENTRIES,
  ACCOUNTING_TERM.ACCOUNTING_REPORTS,
  ACCOUNTING_TERM.ACCOUNTING_FISCAL_COMPLIANCE,
  ACCOUNTING_TERM.ACCOUNTING_MONITOR,
  ACCOUNTING_TERM.ACCOUNTING_PERIOD_CLOSE,
]);

interface CartSettings {
  billing?: {
    billingMode?: string;
    authorizationFlowEnabled?: boolean;
    serviceCommissions?: {
      enabled?: boolean;
    };
  };
}

type BusinessData = {
  businessType?: string | null;
  name?: string | null;
} & Record<string, unknown>;

type MenuPreloader = () => void | Promise<unknown>;

interface SideBarProps {
  isOpen: boolean;
  handleOpenMenu: () => void;
}

const getMenuItemRenderKey = (
  item: MenuItem,
  group: string,
  index: number,
) =>
  item.route ||
  item.key ||
  `${group}-${item.label ?? item.title ?? 'item'}-${index}`;

const getSearchContextTitle = (item: MenuSearchItem) => {
  const contextTitle = item.searchContextTitle;
  return typeof contextTitle === 'string' && contextTitle.trim()
    ? contextTitle
    : null;
};

const ignorePreloadError = () => undefined;

const runMenuPreload = (preload: MenuPreloader) => {
  try {
    void Promise.resolve(preload()).catch(ignorePreloadError);
  } catch {
    ignorePreloadError();
  }
};

const useMenuFiltering = () => {
  const settings = useSelector(SelectSettingCart) as CartSettings;
  const billingMode = settings.billing?.billingMode;
  const authorizationFlowEnabled = settings.billing?.authorizationFlowEnabled;
  const serviceCommissionsEnabled =
    settings.billing?.serviceCommissions?.enabled === true;
  const business = useSelector(selectBusinessData) as BusinessData | null;
  const businessType = business?.businessType || null;
  const links = useMenuData() as MenuItem[];
  const canSeeDeveloperGroup = useHasDeveloperAccess();

  return useMemo(() => {
    const filteredLinks = links.reduce<MenuItem[]>((acc, item) => {
      let includeItem = true;
      if (item.key && item.condition) {
        includeItem = item.condition({
          billingMode,
          businessType,
          authorizationFlowEnabled,
          serviceCommissionsEnabled,
        });
      }

      if (!includeItem) return acc;

      const newItem = { ...item };

      if (item.submenu) {
        const filteredSubmenu = item.submenu.filter((subItem) => {
          if (subItem.key && subItem.condition) {
            return subItem.condition({
              billingMode,
              authorizationFlowEnabled,
              serviceCommissionsEnabled,
            });
          }
          return true;
        });

        if (filteredSubmenu.length > 0) {
          newItem.submenu = filteredSubmenu;
        } else {
          delete newItem.submenu;
        }
      }

      acc.push(newItem as MenuItem);
      return acc;
    }, []);

    const grouped = filteredLinks.reduce<Record<string, MenuItem[]>>(
      (acc, item) => {
        const groupKey = item.group ?? 'undefined';
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
      },
      {},
    );
    // Remove developer group if user lacks developer access
    if (!canSeeDeveloperGroup && grouped.developer) {
      delete grouped.developer;
    }
    return grouped;
  }, [
    links,
    billingMode,
    businessType,
    authorizationFlowEnabled,
    serviceCommissionsEnabled,
    canSeeDeveloperGroup,
  ]);
};

export const SideBar = ({ isOpen, handleOpenMenu }: SideBarProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const didPrefetchRoutesRef = useRef(false);
  const [submenuPortalElement, setSubmenuPortalElement] =
    useState<HTMLDivElement | null>(null);
  const [menuSearchValue, setMenuSearchValue] = useState('');
  const user = useSelector(selectUser) as UserIdentity | null;
  const groupedLinks = useMenuFiltering();
  const visibleGroupedLinks = useMemo(
    () => filterGroupedMenuByQuery(groupedLinks, menuSearchValue),
    [groupedLinks, menuSearchValue],
  );
  const isSearchingMenu = menuSearchValue.trim().length > 0;
  const hasMenuResults = Object.values(visibleGroupedLinks).some(
    (items) => items.length > 0,
  );
  const { abilities } = useUserAccess();
  const canAccessGeneralConfig =
    abilities.can('manage', 'Business') ||
    abilities.can('manage', 'business-settings');

  const { GENERAL_CONFIG_BUSINESS } = ROUTES_PATH.SETTING_TERM;

  const handleCloseSidebar = useCallback(() => {
    dispatch(closeMenu());
  }, [dispatch]);

  const handleGoToSetting = useCallback(() => {
    if (!canAccessGeneralConfig) return;
    handleCloseSidebar();
    navigate(GENERAL_CONFIG_BUSINESS);
  }, [
    canAccessGeneralConfig,
    handleCloseSidebar,
    navigate,
    GENERAL_CONFIG_BUSINESS,
  ]);

  const handleOpenNotifications = useCallback(() => {
    dispatch(openNotificationCenter());
    handleOpenMenu();
  }, [dispatch, handleOpenMenu]);

  const handleSubmenuLayerRef = useCallback(
    (node: HTMLDivElement | null) => {
      setSubmenuPortalElement(node);
    },
    [],
  );

  useEffect(() => {
    const shouldPrefetchInDev =
      import.meta.env.DEV &&
      import.meta.env.VITE_ENABLE_DEV_ROUTE_PREFETCH === 'true';
    if (!shouldPrefetchInDev || didPrefetchRoutesRef.current) return;

    const preloaders: MenuPreloader[] = [];
    const seenRoutes = new Set();

    const collectPreloaders = (items: MenuItem[] = []) => {
      items.forEach((item) => {
        if (item?.route && typeof item?.preload === 'function') {
          if (!DEV_PREFETCH_ROUTES.has(item.route)) {
            return;
          }
          if (!seenRoutes.has(item.route)) {
            seenRoutes.add(item.route);
            preloaders.push(item.preload);
          }
        }
        if (Array.isArray(item?.submenu)) {
          collectPreloaders(item.submenu);
        }
      });
    };

    Object.values(visibleGroupedLinks).forEach((items) =>
      collectPreloaders(items),
    );

    if (!preloaders.length) return;

    didPrefetchRoutesRef.current = true;

    const runPreloads = () => {
      preloaders.forEach((preload, index) => {
        setTimeout(() => {
          runMenuPreload(preload);
        }, index * 60);
      });
    };

    if (typeof requestIdleCallback === 'function') {
      const idleId = requestIdleCallback(runPreloads, { timeout: 1500 });
      return () => {
        if (typeof cancelIdleCallback === 'function') {
          cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = setTimeout(runPreloads, 200);
    return () => clearTimeout(timeoutId);
  }, [visibleGroupedLinks]);

  return (
    <Container
      variants={SIDEBAR_VARIANTS as any}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
    >
      <Wrapper>
        <Header>
          <HeaderContent>
            <CloseButtonContainer>
              <OpenMenuButton isOpen={isOpen} onClick={handleOpenMenu} />
            </CloseButtonContainer>
            <LogoContainer />
            <WebName />
          </HeaderContent>
          <ActionButtons>
            <ButtonIconMenu
              icon={icons.system.notification}
              onClick={handleOpenNotifications}
              aria-label="Open notifications"
            />
            {canAccessGeneralConfig && (
              <ButtonIconMenu
                icon={icons.operationModes.setting}
                onClick={handleGoToSetting}
                aria-label="Open settings"
              />
            )}
          </ActionButtons>
        </Header>
        <UserSection user={user} />
        <SidebarSearch value={menuSearchValue} onChange={setMenuSearchValue} />
        <NavigationBody>
          {hasMenuResults ? (
            <NavigationLinks>
              {Object.entries(visibleGroupedLinks).map(([group, items]) => (
                <MenuGroup key={group}>
                  <MenuContainer>
                    {items.map((item, index) => {
                      const contextTitle = isSearchingMenu
                        ? getSearchContextTitle(item)
                        : null;
                      const previousContextTitle =
                        index > 0
                          ? getSearchContextTitle(items[index - 1])
                          : null;
                      const shouldRenderContext =
                        contextTitle &&
                        contextTitle !== previousContextTitle;

                      return (
                        <React.Fragment
                          key={`${getMenuItemRenderKey(item, group, index)}-${isOpen ? 'open' : 'closed'}`}
                        >
                          {shouldRenderContext && (
                            <SearchContextHeader>
                              {contextTitle}
                            </SearchContextHeader>
                          )}
                          <MenuLink
                            isSidebarOpen={isOpen}
                            item={item}
                            onActionDone={handleCloseSidebar}
                            searchQuery={
                              isSearchingMenu ? menuSearchValue : ''
                            }
                            submenuPortalElement={submenuPortalElement}
                          />
                        </React.Fragment>
                      );
                    })}
                  </MenuContainer>
                </MenuGroup>
              ))}
            </NavigationLinks>
          ) : (
            <EmptySearchState role="status" aria-live="polite">
              No hay opciones para esa búsqueda.
            </EmptySearchState>
          )}
        </NavigationBody>
        <SubmenuLayer ref={handleSubmenuLayerRef} />
      </Wrapper>
    </Container>
  );
};

const Container = styled(m.div)`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9900;
  width: 100%;
  max-width: 400px;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  background-color: white;
  border-right: 1px solid rgb(0 0 0 / 10%);
  border-radius: 0 10px 10px 0;
  box-shadow:
    5px 0 15px rgb(0 0 0 / 10%),
    10px 0 25px rgb(0 0 0 / 5%);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const Wrapper = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  @media (width <= 600px) {
    max-width: 500px;
  }
`;

const SubmenuLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 20;
  overflow: hidden;
  pointer-events: none;
`;

const NavigationBody = styled.div`
  min-height: 0;
  padding: 0.6em 0.9em;
  overflow: hidden scroll;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  background-color: ${(props: any) => props.theme.bg.color2};
  -webkit-overflow-scrolling: touch;
`;

const NavigationLinks = styled.div`
  display: grid;
  align-content: start;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 0.4rem;
  padding: 0;
`;
const MenuGroup = styled.div`
  overflow: hidden;
`;

const MenuContainer = styled.div`
  padding: 0.25rem;
  overflow: hidden;
  background-color: ${(props: any) => props.theme.bg.shade};
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: var(--border-radius, 8px);
`;

const EmptySearchState = styled.div`
  padding: 1rem;
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--gray-6);
  text-align: center;
  background-color: ${(props: any) => props.theme.bg.shade};
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: var(--border-radius, 8px);
`;

const SearchContextHeader = styled.div`
  padding: 0.55rem 0.8rem 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.2;
  color: rgb(85 85 85);
  background-color: ${(props: any) => props.theme.bg.color2};
  border-bottom: var(--border-primary);
`;

const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.75em;
  padding: 1rem;
  background-color: ${(props: any) => props.theme.bg.color};

  @media (width <= 768px) {
    height: 2.75em;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoContainer = styled.div`
  width: 2.4rem;
  height: 2em;
`;
