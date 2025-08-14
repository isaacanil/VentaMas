import React, { useState, Fragment, useRef, useEffect } from 'react'
import { useClickOutSide } from '../../../hooks/useClickOutSide'
import styled from 'styled-components'
import { SideBar } from './Components/SideBar'
import { useDispatch } from 'react-redux'
import { toggleOpenMenu } from '../../../features/nav/navSlice'
import { OpenMenuButton } from '../system/Button/OpenMenuButton'
import { GlobalMenu } from './GlobalMenu/GlobalMenu'
import { icons } from '../../../constants/icons/icons'
import { GoBackButton } from '../system/Button/GoBackButton'
import { Input } from 'antd';
import { NotificationButton } from './Components/NotificationButton/NotificationButton'
import { ButtonIconMenu } from '../system/Button/ButtonIconMenu'
import { SearchPanel } from '../../../components/common/SearchPanel/SearchPanel'

export const MenuApp = ({ 
  data, 
  sectionName, 
  sectionNameIcon, 
  borderRadius, 
  setSearchData, 
  searchData, 
  displayName = "",
  showBackButton = true, // Nueva prop para controlar si se muestra el botón
  showNotificationButton = false, // Nueva prop para controlar si se muestra el botón de notificaciones
  onBackClick,          // Nueva prop para manejar el click personalizado
  onReportSaleOpen      // Nueva prop para el gráfico de ventas
}) => {
  const dispatch = useDispatch();
  const ref = useRef(null)

  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);

  const handledMenu = () => { setIsOpenMenu(!isOpenMenu) };

  useEffect(() => {
    dispatch(toggleOpenMenu(isOpenMenu))
  }, [isOpenMenu])

  const closeMenu = () => { setIsOpenMenu(false) }
  const openSearchPanel = () => { setIsSearchPanelOpen(true) }
  const closeSearchPanel = () => { setIsSearchPanelOpen(false) }

  useClickOutSide(ref, !isOpenMenu, closeMenu)

  return (
    <Fragment>
      <Backdrop isOpen={isOpenMenu ? true : false} onClick={closeMenu} />
      
      {/* Search Panel para móviles */}
      <SearchPanel 
        isOpen={isSearchPanelOpen}
        onClose={closeSearchPanel}
        searchData={searchData}
        setSearchData={setSearchData}
        displayName={displayName}
        sectionName={sectionName}
      />

      <Container borderRadius={borderRadius} ref={ref} isOpen={isOpenMenu ? true : false}>
        <Group>
          <OpenMenuButton isOpen={isOpenMenu} onClick={handledMenu} />
          {showBackButton && <GoBackButton onClick={onBackClick} />}
          {showNotificationButton && <NotificationButton handleCloseMenu={closeMenu} />}

          {sectionName && (
            <SectionName>{sectionNameIcon}{sectionName}</SectionName>
          )}
          
          {/* Botón de búsqueda para móviles */}
          {setSearchData && (
            <MobileSearchButton onClick={openSearchPanel}>
              <ButtonIconMenu icon={icons.operationModes.search} onClick={openSearchPanel} />
            </MobileSearchButton>
          )}
          
          {/* Input de búsqueda para desktop */}
          {setSearchData && (
            <SearchInputWrapper>
              <Input
                prefix={icons.operationModes.search}
                placeholder={`Buscar ${displayName || sectionName || ""}...`}
                value={searchData}
                onChange={(e) => setSearchData(e.target.value)}
                allowClear
                style={{ width: '100%', maxWidth: 300 }}
              />
            </SearchInputWrapper>
          )}
        </Group>
        <GlobalMenu data={data} setSearchData={setSearchData} searchData={searchData} onReportSaleOpen={onReportSaleOpen} />
        <SideBar isOpen={isOpenMenu} handleOpenMenu={handledMenu} />
      </Container>
    </Fragment>

  )
}
const Backdrop = styled.div`
  height: calc(100vh);
  width: 100%;
  position: absolute;
  left: 0;
  right: 0;
  backdrop-filter: blur(0px);
    z-index: 10;
    pointer-events: none;
    transition: all 1s  ease;
   ${props => {
    switch (props.isOpen) {
      case true:
        return `
        z-index: 1000;
        display: block;
        pointer-events: visible;
        backdrop-filter: blur(2px);
        webkit-backdrop-filter: blur(6px);
        background-color: rgba(0, 0, 0, 0.100);
        `
      default:
        break;
    }
  }}
`
const Container = styled.div`

  user-select: none;
  background-color: ${props => props.theme.bg.color}; 
  
  width: 100%;
  height: 2.75em;
  display: flex;
  align-items: center;
  align-content: center;
  padding: 0 1em;
  gap: 1em;
  
  @media (max-width: 768px) {
    height: 3.2em;
    padding: 0 1em;
    gap: 1em;
  }
  
  // z-index: 9;
  ${props => {
    switch (props.isOpen) {
      case true:
        return `
          //z-index: 9;
        `
      case false:
        return `
       // z-index: 10;
        transition-property: z-index;
        transition-delay: 400ms;
      `
      default:
        break;
    }
  }}
   ${props => {
    switch (props.borderRadius) {
      case 'bottom-right':
        return `
         border-bottom-right-radius: var(--border-radius-light);
         @media (max-width: 800px){
          border-bottom-right-radius: 0px;
         padding-right: 1em;
        }   
        `
        break;
      default:
        break;
    }
  }}
`
const Group = styled.div`
  display: grid;
  grid-template-columns: auto auto auto auto;
  width: 100%;
  align-items: center;
  gap: 0.4em;
  justify-content: start;

  // Mejoras para móviles más grandes
  @media (max-width: 1024px) {
    gap: 0.6em;
  }
  
  @media (max-width: 768px) {
    gap: 0.5em;
    grid-template-columns: auto auto auto auto;
  }
  
  @media (max-width: 480px) {
    gap: 0.4em;
  }
`
const AutoHidden = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  transition: opacity 1s linear;
  ${props => {
    switch (props.menuIsOpen) {
      case true:
        return `  
        opacity: 0; 
        `
      default:
        break;
    }
  }}
  
    
`
const SectionName = styled.div`
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1.1em;
  color: white;
  height: 1.8em;
  max-width: 250px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  gap: 0.4em;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.200);
  padding: 0 0.4em;
  
  // Mejoras para móviles - elementos más grandes en pantallas más pequeñas
  @media (max-width: 1024px) {
    font-size: 1.1em;
    height: 1.9em;
    padding: 0 0.6em;
    gap: 0.5em;
    max-width: 280px;
  }
  
  @media (max-width: 768px) {
    font-size: 1.15em;
    height: 2em;
    padding: 0 0.5em;
    max-width: 200px;
  }
  
  @media (max-width: 480px) {
    font-size: 1.2em;
    height: 2.2em;
    padding: 0 0.6em;
    max-width: 180px;
  }
`

const SearchInputWrapper = styled.div`
  display: flex;
  width: 100%;
  
  @media (max-width: 1024px) {
    max-width: 350px;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`

const MobileSearchButton = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

