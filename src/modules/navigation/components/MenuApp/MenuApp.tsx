import { InputGroup } from '@heroui/react';
import {
  useEffect,
  useState,
  Fragment,
  useRef,
  useCallback,
  type ChangeEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import {
  useDashboardMenu,
  type DashboardMenuConfig,
} from '@/layouts/dashboardMenuContext';

import { SearchPanel } from '@/components/common/SearchPanel/SearchPanel';
import { icons } from '@/constants/icons/icons';
import {
  toggleMenu,
  closeMenu,
  selectMenuOpenStatus,
} from '@/features/nav/navSlice';
import { selectUser } from '@/features/auth/userSlice';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import { ButtonIconMenu } from '@/components/ui/Button/ButtonIconMenu';
import { GoBackButton } from '@/components/ui/Button/GoBackButton';
import { OpenMenuButton } from '@/components/ui/Button/OpenMenuButton';
import ROUTES_PATH from '@/router/routes/routesName';

import { NotificationButton } from './Components/NotificationButton/NotificationButton';
import { SideBar } from './Components/SideBar';
import { GlobalMenu } from './GlobalMenu/GlobalMenu';
import type { ToolbarComponentProps } from './GlobalMenu/types';

interface MenuAppProps {
  data?: unknown;
  sectionName?: string;
  sectionNameIcon?: ReactNode;
  setSearchData?: Dispatch<SetStateAction<string>>;
  searchData?: string;
  displayName?: string;
  toolbarProps?: Omit<ToolbarComponentProps, 'side'>;
  showBackButton?: boolean;
  showNotificationButton?: boolean;
  onBackClick?: () => void;
  forceRender?: boolean;
}

export type MenuAppUIProps = Omit<MenuAppProps, 'forceRender'>;
const EMPTY_TOOLBAR_PROPS: Omit<ToolbarComponentProps, 'side'> = {};
/**
 * @param {Object} props
 * @param {any} [props.data]
 * @param {string} [props.sectionName]
 * @param {any} [props.sectionNameIcon]
 * @param {Function} [props.setSearchData]
 * @param {string} [props.searchData]
 * @param {string} [props.displayName]
 * @param {Object} [props.toolbarProps]
 * @param {boolean} [props.showBackButton]
 * @param {boolean} [props.showNotificationButton]
 * @param {Function} [props.onBackClick]
 */

export const MenuApp = ({
  data,
  sectionName,
  sectionNameIcon,
  setSearchData,
  searchData,
  displayName = '',
  toolbarProps = EMPTY_TOOLBAR_PROPS,
  showBackButton = true, // Nueva prop para controlar si se muestra el botón
  showNotificationButton = false, // Nueva prop para controlar si se muestra el botón de notificaciones
  onBackClick, // Nueva prop para manejar el click personalizado
  forceRender = false,
}: MenuAppProps) => {
  const menuContext = useDashboardMenu();

  useEffect(() => {
    if (!menuContext) return;

    if (forceRender) {
      menuContext.clearMenuConfig();
      return;
    }

    const menuConfig: DashboardMenuConfig = {
      data,
      sectionName,
      sectionNameIcon,
      setSearchData,
      searchData,
      displayName,
      toolbarProps,
      showBackButton,
      showNotificationButton,
      onBackClick,
    };

    menuContext.setMenuConfig(menuConfig);
    return () => {
      menuContext.clearMenuConfig();
    };
  }, [
    menuContext,
    forceRender,
    data,
    sectionName,
    sectionNameIcon,
    setSearchData,
    searchData,
    displayName,
    toolbarProps,
    showBackButton,
    showNotificationButton,
    onBackClick,
  ]);

  if (menuContext && !forceRender) {
    return null;
  }

  return (
    <MenuAppUI
      data={data}
      sectionName={sectionName}
      sectionNameIcon={sectionNameIcon}
      setSearchData={setSearchData}
      searchData={searchData}
      displayName={displayName}
      toolbarProps={toolbarProps}
      showBackButton={showBackButton}
      showNotificationButton={showNotificationButton}
      onBackClick={onBackClick}
    />
  );
};

export const MenuAppUI = ({
  data,
  sectionName,
  sectionNameIcon,
  setSearchData,
  searchData,
  displayName = '',
  toolbarProps = EMPTY_TOOLBAR_PROPS,
  showBackButton = true,
  showNotificationButton = false,
  onBackClick,
}: MenuAppUIProps) => {
  const SEARCH_COMMIT_DELAY_MS = 120;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement | null>(null);
  const user = useSelector(selectUser) as Record<string, unknown> | null;

  const isOpenMenu = useSelector(selectMenuOpenStatus);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const normalizedSearchData = typeof searchData === 'string' ? searchData : '';
  const [desktopSearchValue, setDesktopSearchValue] =
    useState(normalizedSearchData);
  const [prevNormalizedSearchData, setPrevNormalizedSearchData] =
    useState(normalizedSearchData);
  const searchCommitTimerRef = useRef<number | null>(null);

  if (prevNormalizedSearchData !== normalizedSearchData) {
    setPrevNormalizedSearchData(normalizedSearchData);
    setDesktopSearchValue(normalizedSearchData);
  }

  const handledMenu = useCallback(() => {
    dispatch(toggleMenu());
  }, [dispatch]);

  const handleCloseMenu = useCallback(() => {
    dispatch(closeMenu());
  }, [dispatch]);

  const openSearchPanel = useCallback(() => setIsSearchPanelOpen(true), []);
  const closeSearchPanel = useCallback(() => setIsSearchPanelOpen(false), []);

  const clearSearchCommitTimer = useCallback(() => {
    if (searchCommitTimerRef.current == null) return;
    window.clearTimeout(searchCommitTimerRef.current);
    searchCommitTimerRef.current = null;
  }, []);

  const commitSearchValue = useCallback(
    (value: string) => {
      if (!setSearchData) return;
      setSearchData(value);
    },
    [setSearchData],
  );

  const scheduleSearchCommit = useCallback(
    (value: string) => {
      clearSearchCommitTimer();
      searchCommitTimerRef.current = window.setTimeout(() => {
        commitSearchValue(value);
      }, SEARCH_COMMIT_DELAY_MS);
    },
    [clearSearchCommitTimer, commitSearchValue],
  );

  const handleDesktopSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDesktopSearchValue(value);
      scheduleSearchCommit(value);
    },
    [scheduleSearchCommit],
  );

  const flushSearchCommit = useCallback(() => {
    clearSearchCommitTimer();
    commitSearchValue(desktopSearchValue);
  }, [clearSearchCommitTimer, commitSearchValue, desktopSearchValue]);

  useEffect(
    () => () => {
      clearSearchCommitTimer();
    },
    [clearSearchCommitTimer],
  );

  useClickOutSide(ref, isOpenMenu, handleCloseMenu);

  return (
    <Fragment>
      <Backdrop $isOpen={isOpenMenu ? true : false} onClick={handleCloseMenu} />

      <SearchPanel
        isOpen={isSearchPanelOpen}
        onClose={closeSearchPanel}
        searchData={searchData}
        setSearchData={setSearchData}
        displayName={displayName}
        sectionName={sectionName}
      />

      <Container
        ref={ref}
        $isOpen={isOpenMenu ? true : false}
      >
        <Group>
          <OpenMenuButton isOpen={isOpenMenu} onClick={handledMenu} />

          {showBackButton && <GoBackButton onClick={onBackClick} />}

          {showNotificationButton && (
            <NotificationButton handleCloseMenu={handleCloseMenu} />
          )}

          {sectionName && (
            <SectionName>
              {sectionNameIcon}
              {sectionName}
            </SectionName>
          )}

          {/* Botón de búsqueda para móviles */}
          {setSearchData && (
            <MobileSearchButton onClick={openSearchPanel}>
              <ButtonIconMenu
                icon={icons.operationModes.search}
                onClick={openSearchPanel}
              />
            </MobileSearchButton>
          )}

          {/* Input de búsqueda para desktop */}
          {setSearchData && (
            <SearchInputWrapper data-role="search-wrapper">
              <SearchInputGroup fullWidth>
                <InputGroup.Prefix>
                  {icons.operationModes.search}
                </InputGroup.Prefix>
                <InputGroup.Input
                  type="search"
                  placeholder={`Buscar ${displayName || sectionName || ''}...`}
                  value={desktopSearchValue}
                  onChange={handleDesktopSearchChange}
                  onBlur={flushSearchCommit}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      flushSearchCommit();
                    }
                  }}
                />
                {desktopSearchValue && (
                  <InputGroup.Suffix className="search-input-actions">
                    <ClearSearchButton
                      aria-label="Limpiar búsqueda"
                      onClick={() => {
                        clearSearchCommitTimer();
                        setDesktopSearchValue('');
                        commitSearchValue('');
                      }}
                      type="button"
                    >
                      ×
                    </ClearSearchButton>
                  </InputGroup.Suffix>
                )}
              </SearchInputGroup>
            </SearchInputWrapper>
          )}
        </Group>
        <GlobalMenu
          data={data}
          setSearchData={setSearchData}
          searchData={searchData}
          {...toolbarProps}
        />
        <SideBar isOpen={isOpenMenu} handleOpenMenu={handledMenu} />
      </Container>
    </Fragment>
  );
};
const Backdrop = styled.div<{ $isOpen: boolean }>`
  height: calc(100vh);
  width: 100%;
  position: absolute;
  left: 0;
  right: 0;
  backdrop-filter: blur(0);
  z-index: 10;
  pointer-events: none;
  transition: all 1s ease;
  ${({ $isOpen }: { $isOpen: boolean }) => {
    switch ($isOpen) {
      case true:
        return `
        z-index: 1000;
        display: block;
        pointer-events: visible;
        backdrop-filter: blur(2px);
        webkit-backdrop-filter: blur(6px);
        background-color: rgba(0, 0, 0, 0.100);
        `;
      default:
        break;
    }
  }}
`;
const Container = styled.div<{ $isOpen: boolean }>`
  background-color: ${(props) => props.theme.bg.color};
  width: 100%;
  height: 2.75em;
  min-height: 2.75em;
  display: flex;
  flex: 0 0 auto;
  flex-shrink: 0;
  padding: 0 1em;
  gap: 0.4em;

  @media (width <= 768px) {
    gap: 1em;
    height: 3.2em;
    min-height: 3.2em;
    padding: 0 1em;
  }

  ${({ $isOpen }: { $isOpen: boolean }) => {
    switch ($isOpen) {
      case true:
        return `
        `;
      case false:
        return `
        transition-property: z-index;
        transition-delay: 400ms;
      `;
      default:
        break;
    }
  }}
`;
const Group = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  flex-wrap: nowrap;
  gap: 0.4em;

  /* Evita que los botones u otros elementos se achiquen excesivamente */
  & > * {
    flex-shrink: 0;
  }

  /* Solo el wrapper del input puede crecer y encogerse para absorber espacio */
  & > [data-role='search-wrapper'] {
    flex: 1 1 auto;
    flex-shrink: 1;
    min-width: 160px;
  }

  /* Mejoras para móviles más grandes */
  @media (width <= 1024px) {
    gap: 0.6em;
  }

  @media (width <= 768px) {
    gap: 0.5em;
  }

  @media (width <= 480px) {
    gap: 0.4em;
  }
`;
const SectionName = styled.div`
  align-items: center;
  background-color: rgb(0 0 0 / 20%);
  border-radius: 6px;
  color: white;
  display: flex;
  font-size: 1.1em;
  font-weight: 600;
  gap: 0.4em;
  height: 1.8em;
  max-width: 250px;
  overflow: hidden;
  padding: 0 0.4em;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* Mejoras para móviles - elementos más grandes en pantallas más pequeñas */
  @media (width <= 1024px) {
    font-size: 1.1em;
    gap: 0.5em;
    height: 1.9em;
    max-width: 280px;
    padding: 0 0.6em;
  }

  @media (width <= 768px) {
    font-size: 1.15em;
    height: 2em;
    max-width: 200px;
    padding: 0 0.5em;
  }

  @media (width <= 480px) {
    font-size: 1.2em;
    height: 2.2em;
    max-width: 180px;
    padding: 0 0.6em;
  }
`;

const SearchInputWrapper = styled.div`
  display: flex;
  flex: 1 1 auto;
  min-width: 160px;
  max-width: 300px;
  overflow: hidden;
  width: auto;

  @media (width <= 1024px) {
    max-width: 350px;
  }

  @media (width <= 768px) {
    display: none;
  }
`;

const SearchInputGroup = styled(InputGroup)`
  width: 100%;
  min-width: 0;
  height: 32px;
  min-height: 32px;

  .input-group__input,
  [data-slot='input-group-input'] {
    min-width: 0;
    height: 100%;
    font-size: 14px;
  }

  .search-input-actions,
  .input-group__suffix {
    height: 100%;
    padding-right: 6px;
  }
`;

const ClearSearchButton = styled.button`
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  font-size: 16px;
  line-height: 1;
  color: currentColor;
  cursor: pointer;
  border-radius: 999px;
  opacity: 0.62;

  &:hover {
    opacity: 1;
  }
`;

const MobileSearchButton = styled.div`
  display: none;

  @media (width <= 768px) {
    align-items: center;
    display: flex;
    justify-content: center;
  }
`;
