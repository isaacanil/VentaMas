import React, { useState, Fragment, useRef, useEffect } from 'react'

import { MenuData } from './MenuData'
import { AddProductButton, WebName } from '../../'
import { useClickOutSide } from '../../../hooks/useClickOutSide'
import styled from 'styled-components'
import { SideBar } from './SideBar'
import { Button } from '../../'
import { MdFullscreen, MdOutlineFullscreenExit, MdOutlineHideImage, MdOutlineImage, MdSubtitles, MdSubtitlesOff } from "react-icons/md";
import { BsArrowsFullscreen, BsFullscreenExit, BsList } from 'react-icons/bs'
import { TbColumns } from 'react-icons/tb'
import { handleImageHidden, handleRowMode, selectImageHidden, ReloadImageHiddenSetting, selectIsRow, toggleFullScreen, selectFullScreen, selectCategoryGrouped, toggleCategoryGrouped } from '../../../features/setting/settingSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useMatch } from 'react-router-dom'
import { SearchProductBar } from './SearchProductBar'
import { Tooltip } from '../system/Button/Tooltip'
import { colorPalette } from '../../../features/theme/themeSlice'
import { toggleOpenMenu } from '../../../features/nav/navSlice'
import { FaSearch } from 'react-icons/fa'
import { SearchInput } from '../system/Inputs/SearchInput'
import { faCompress, faExpand, faGrip, faGripLines, faHeading, faImage } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { OpenMenuButton } from '../system/Button/OpenMenuButton'
import { GlobalMenu } from './GlobalMenu/GlobalMenu'

export const MenuApp = ({ borderRadius, setSearchData, searchData }) => {
  const { color } = colorPalette()
  const dispatch = useDispatch()
  const [isOpenMenu, setIsOpenMenu] = useState(false)
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false)
  const showSubMenu = () => { setIsOpenSubMenu(!isOpenSubMenu) };
  const handledMenu = () => {
    setIsOpenMenu(!isOpenMenu)
  };
  useEffect(() => {
    dispatch(toggleOpenMenu(isOpenMenu))
  }, [isOpenMenu])
  const ref = useRef(null)
  const anotherRef = useRef(null)

  const closeMenu = () => {
    setIsOpenMenu(false)
  }
  useClickOutSide(ref, !isOpenMenu, closeMenu)


  return (
    <Fragment>
      <Backdrop isOpen={isOpenMenu ? true : false} />
      <Container bgColor={color} borderRadius={borderRadius} ref={ref} isOpen={isOpenMenu ? true : false}>
        <Group>
          <OpenMenuButton isOpenMenu={isOpenMenu} onClick={handledMenu}/>
        </Group>
          <GlobalMenu setSearchData={setSearchData} searchData={searchData} />
        <SideBar links={MenuData} isOpen={isOpenMenu} handleOpenMenu={handledMenu} />
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
        z-index: 1000;
        pointer-events: none;
        transition: all 1s  ease;
   ${props => {
    switch (props.isOpen) {
      case true:
        return `
        z-index: 10;
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
   background-color: ${props => props.bgColor};
   width: 100%;
   height: 2.75em;
   display: flex;
   align-items: center;
   align-content: center;
   padding: 0 1em;
   gap: 1em;
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
  display: flex;
  align-items: center;
  gap: 0.8em;
 
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

