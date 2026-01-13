import { Input } from 'antd';
import {
  useState,
  Fragment,
  useRef,
  useCallback,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';


import { SearchPanel } from '@/components/common/SearchPanel/SearchPanel';
import { icons } from '@/constants/icons/icons';
import { toggleMenu, closeMenu, selectMenuOpenStatus } from '@/features/nav/navSlice';
import { useClickOutSide } from '@/hooks/useClickOutSide';
import { ButtonIconMenu } from '@/components/ui/Button/ButtonIconMenu';
import { GoBackButton } from '@/components/ui/Button/GoBackButton';
import { OpenMenuButton } from '@/components/ui/Button/OpenMenuButton';

import { NotificationButton } from './Components/NotificationButton/NotificationButton';
import { SideBar } from './Components/SideBar';
import { GlobalMenu } from './GlobalMenu/GlobalMenu';
import type { ToolbarComponentProps } from './GlobalMenu/types';

interface MenuAppProps {
  data?: unknown;
  sectionName?: string;
  sectionNameIcon?: ReactNode;
  borderRadius?: string;
  setSearchData?: Dispatch<SetStateAction<string>>;
  searchData?: string;
  displayName?: string;
  sectionStatus?: ReactNode;
  toolbarProps?: Omit<ToolbarComponentProps, 'side'>;
  showBackButton?: boolean;
  showNotificationButton?: boolean;
  onBackClick?: () => void;
  onReportSaleOpen?: () => void;
}
/**
 * @param {Object} props
 * @param {any} [props.data]
 * @param {string} [props.sectionName]
 * @param {any} [props.sectionNameIcon]
 * @param {string} [props.borderRadius]
 * @param {Function} [props.setSearchData]
 * @param {string} [props.searchData]
 * @param {string} [props.displayName]
 * @param {any} [props.sectionStatus]
 * @param {Object} [props.toolbarProps]
 * @param {boolean} [props.showBackButton]
 * @param {boolean} [props.showNotificationButton]
 * @param {Function} [props.onBackClick]
 * @param {Function} [props.onReportSaleOpen]
 */

export const MenuApp = ({
  data,
  sectionName,
  sectionNameIcon,
  borderRadius,
  setSearchData,
  searchData,
  displayName = '',
  sectionStatus,
  toolbarProps = {},
  showBackButton = true, // Nueva prop para controlar si se muestra el botón
  showNotificationButton = false, // Nueva prop para controlar si se muestra el botón de notificaciones
  onBackClick, // Nueva prop para manejar el click personalizado
  onReportSaleOpen, // Nueva prop para el gráfico de ventas
}: MenuAppProps) => {
  const dispatch = useDispatch();
  const ref = useRef<HTMLDivElement | null>(null);

  const isOpenMenu = useSelector(selectMenuOpenStatus);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);

  const handledMenu = useCallback(() => {
    dispatch(toggleMenu());
  }, [dispatch]);

  const handleCloseMenu = useCallback(() => {
    dispatch(closeMenu());
  }, [dispatch]);

  const openSearchPanel = useCallback(() => setIsSearchPanelOpen(true), []);
  const closeSearchPanel = useCallback(() => setIsSearchPanelOpen(false), []);

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
        $borderRadius={borderRadius}
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

          {sectionStatus && <StatusBadge>{sectionStatus}</StatusBadge>}

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
              <Input
                prefix={icons.operationModes.search}
                placeholder={`Buscar ${displayName || sectionName || ''}...`}
                value={searchData}
                onChange={(e) => setSearchData(e.target.value)}
                allowClear
                style={{ width: '100%', maxWidth: 300 }}
              />
            </SearchInputWrapper>
          )}
        </Group>
        <GlobalMenu
          data={data}
          setSearchData={setSearchData}
          searchData={searchData}
          onReportSaleOpen={onReportSaleOpen}
          {...toolbarProps}
        />
        <SideBar isOpen={isOpenMenu} handleOpenMenu={handledMenu} />
      </Container>
    </Fragment>
  );
};
const Backdrop = styled.div`
  height: calc(100vh);
  width: 100%;
  position: absolute;
  left: 0;
  right: 0;
  backdrop-filter: blur(0);
  z-index: 10;
  pointer-events: none;
  transition: all 1s ease;
  ${({ $isOpen }) => {
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
const Container = styled.div`
  background-color: ${(props) => props.theme.bg.color};
  width: 100%;
  height: 2.75em;
  display: flex;
  padding: 0 1em;
  gap: 0.4em;

  @media (width <= 768px) {
    gap: 1em;
    height: 3.2em;
    padding: 0 1em;
  }

  ${({ $isOpen }) => {
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
  ${({ $borderRadius }) => {
    switch ($borderRadius) {
      case 'bottom-right':
        return `
         border-bottom-right-radius: var(--border-radius-light);
         @media (max-width: 800px){
          border-bottom-right-radius: 0px;
         padding-right: 1em;
        }   
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

const StatusBadge = styled.div`
  align-items: center;
  background-color: rgb(255 255 255 / 15%);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 999px;
  color: rgb(255 255 255 / 90%);
  display: inline-flex;
  font-size: 0.75em;
  font-weight: 600;
  justify-content: center;
  letter-spacing: 0.03em;
  padding: 0.15em 0.75em;
  text-transform: uppercase;

  @media (width <= 768px) {
    font-size: 0.7em;
    padding: 0.1em 0.65em;
  }
`;

const SearchInputWrapper = styled.div`
  display: flex;
  flex: 1 1 auto;
  min-width: 160px;
  overflow: hidden;
  width: auto;

  @media (width <= 1024px) {
    max-width: 350px;
  }

  @media (width <= 768px) {
    display: none;
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
