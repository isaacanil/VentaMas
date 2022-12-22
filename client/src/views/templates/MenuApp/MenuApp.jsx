import React, { useState, Fragment, useRef, useEffect } from 'react'
import Style from './Menu.module.scss'
import { MenuData } from './MenuData'
import { WebName } from '../../'
import { useClickOutSide } from '../../../hooks/useClickOutSide'
import styled from 'styled-components'
import { SideBar } from './SideBar'
import { Button } from '../../'
import { MdOutlineHideImage, MdOutlineImage } from "react-icons/md";
import { BsList } from 'react-icons/bs'
import { TbColumns } from 'react-icons/tb'
import { handleImageHidden, handleRowMode, selectImageHidden, ReloadImageHiddenSetting, selectIsRow } from '../../../features/setting/settingSlice'
import { useDispatch, useSelector } from 'react-redux'
export const MenuApp = ({ borderRadius }) => {
  const dispatch = useDispatch()
  const [isOpenMenu, setIsOpenMenu] = useState(false)
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false)
  const showSubMenu = () => { setIsOpenSubMenu(!isOpenSubMenu) };
  const handledMenu = () => { setIsOpenMenu(!isOpenMenu) };
  const ref = useRef(null)
  const anotherRef = useRef(null)
  const ImageHidden = useSelector(selectImageHidden)
  const viewRowModeRef = useSelector(selectIsRow)
  const closeMenu = () => {
    setIsOpenMenu(false)
  }
  useClickOutSide(ref, !isOpenMenu, closeMenu)
  const handleImageHiddenFN = () => {
    dispatch(
      handleImageHidden()
    )
  }
  const handleRowModeFN = () => {
    dispatch(
      handleRowMode()
    )
  }
  return (
    <Fragment>
      <div
        className={isOpenMenu ?
          (
            `${Style.Menu_backdrop} ${Style.ActiveBackdrop}`
          ) : (
            Style.Menu_backdrop
          )}
        ref={anotherRef}
        onClick={handledMenu}
      >
      </div>
      <Container borderRadius={borderRadius} ref={ref}>
        <Group>
          <div className={Style.MenuBtn} onClick={handledMenu}>
            <div className={!isOpenMenu ? Style.MenuBtn_icon : `${Style.MenuBtn_icon} ${Style.MenuBtn_icon_closed}`}></div>
          </div>
          <div>
            <WebName></WebName>
          </div>
        </Group>
        <Group>
          <Button
            width={'icon32'}
            borderRadius='normal'
            iconOn={<TbColumns/>}
            iconOff={<BsList/>}
            isActivated={viewRowModeRef ? true : false}
            onClick={() => handleRowModeFN()}
           />
          <Button
            width={'icon32'}
            borderRadius='normal'
            iconOn={<MdOutlineImage/>}
            iconOff={<MdOutlineHideImage />}
            isActivated={ImageHidden ? true : false}
            onClick={() => handleImageHiddenFN()}
          />
        </Group>
        <SideBar links={MenuData} isOpen={isOpenMenu} />
      </Container>
    </Fragment>

  )
}

const Container = styled.div`
  position: relative;
   user-select: none;
   background-color: var(--icolor);
   width: 100%;
   height: 2.75em;
   display: flex;
   align-items: center;
   align-content: center;
   justify-content: space-between;
   padding: 0 1em;
   z-index: 10;
  
   ${props => {
     switch (props.borderRadius) {
       case 'bottom-right':
         return `
         border-bottom-right-radius: 10px;
         padding-right: 10px;
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
  gap: 1.2em;
`

