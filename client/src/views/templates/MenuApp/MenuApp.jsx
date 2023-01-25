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
import { useMatch } from 'react-router-dom'
import { SearchProductBar } from './SearchProductBar'
import { Tooltip } from '../system/Button/Tooltip'
export const MenuApp = ({ borderRadius, setSearchData, searchData }) => {
  const dispatch = useDispatch()
  const [isOpenMenu, setIsOpenMenu] = useState(false)
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false)
  const showSubMenu = () => { setIsOpenSubMenu(!isOpenSubMenu) };
  const handledMenu = () => { setIsOpenMenu(!isOpenMenu) };
  const ref = useRef(null)
  const anotherRef = useRef(null)
  const ImageHidden = useSelector(selectImageHidden)
  const viewRowModeRef = useSelector(selectIsRow)
  const matchWithVenta = useMatch('/app/venta/:id')
  const matchWithInventory = useMatch('/app/inventario/items')
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
      {/* <div
        className={isOpenMenu ?
          (
            `${Style.Menu_backdrop} ${Style.ActiveBackdrop}`
          ) : (
            Style.Menu_backdrop
          )}
        ref={anotherRef}
        onClick={handledMenu}
      >
      </div> */}
      <Backdrop isOpen={isOpenMenu ? true : false} />
      <Container borderRadius={borderRadius} ref={ref} isOpen={isOpenMenu ? true : false}>
        <Group>
          <div className={Style.MenuBtn} onClick={handledMenu}>
            <div className={!isOpenMenu ? Style.MenuBtn_icon : `${Style.MenuBtn_icon} ${Style.MenuBtn_icon_closed}`}></div>
          </div>
          {
            !matchWithVenta ? (
              <div>
                <WebName></WebName>
              </div>
            ) : null
          }
          {
            matchWithVenta ? (
              <SearchProductBar searchData={searchData} setSearchData={setSearchData}></SearchProductBar>
            ) : null
          }
        </Group>
        {
          matchWithVenta ? (
            <Group>
              <Tooltip
                placement='bottom'
                description={'Cambiar vista'}
                Children={
                  <Button
                    width={'icon32'}
                    borderRadius='normal'
                    iconOn={<TbColumns />}
                    iconOff={<BsList />}
                    isActivated={viewRowModeRef ? true : false}
                    onClick={() => handleRowModeFN()}
                  />}
              />
              <Tooltip
                placement='bottom-end'
                description={'Mostrar Imagen'}
                Children={
                  <Button
                    width={'icon32'}
                    borderRadius='normal'
                    iconOn={<MdOutlineImage />}
                    iconOff={<MdOutlineHideImage />}
                    isActivated={ImageHidden ? true : false}
                    onClick={() => handleImageHiddenFN()}
                  />}
              />
            </Group>
          ) : null
        }
        <SideBar links={MenuData} isOpen={isOpenMenu} />
      </Container>
    </Fragment>

  )
}
const Backdrop = styled.div`
  height: calc(100vh);
        width: 100%;
        position: absolute;
        left: 0;
        backdrop-filter: blur(0px);
        z-index: 10;
        pointer-events: none;
        transition: 600ms ease-in-out;
   ${props => {
    switch (props.isOpen) {
      case true:
        return `
        z-index: 999999;
        display: block;
        pointer-events: visible;
        backdrop-filter: blur(10px);
        background-color: rgba(0, 0, 0, 0.200);
        `
      default:
        break;
    }
  }}
`
const Container = styled.div`
  position: relative;
   user-select: none;
   background-color: var(--color);
   width: 100%;
   height: 2.75em;
   display: flex;
   align-items: center;
   align-content: center;
   justify-content: space-between;
   padding: 0 1em;
   z-index: 10;
  ${props => {
    switch (props.isOpen) {
      case true:
        return `
          z-index: 999999;
        `
      case false:
        return `
        z-index: 10;
        transition-property: z-index;
        transition-delay: 3s;
      `
      default:
        break;
    }
  }}
   ${props => {
    switch (props.borderRadius) {
      case 'bottom-right':
        return `
         border-bottom-right-radius: 10px;
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

