import React, { useState, Fragment, useRef } from 'react'
import Style from './Menu.module.scss'
import { NavLink, useMatch, useParams } from 'react-router-dom'
import { MenuData } from './MenuData'
import { MenuLink } from './MenuLink'
import { WebName } from '../../'
import { Account } from '../Account/Account'
import { useOutSideAlerter } from '../../../hooks/useOutSideAlerter'
import styled from 'styled-components'
import { SideBar } from './SideBar'
import { Button } from '../../'
import { MdOutlineHideImage } from "react-icons/md";
import { BsList } from 'react-icons/bs'
import { TbColumns } from 'react-icons/tb'
import { handleImageHidden, selectImageHidden } from '../../../features/setting/settingSlice'
import { useDispatch, useSelector } from 'react-redux'

export const MenuApp = ({ borderRadius }) => {
  const dispatch = useDispatch()
  const [isOpenMenu, setIsOpenMenu] = useState(false)
  const [isOpenSubMenu, setIsOpenSubMenu] = useState(false)
  const showSubMenu = () => { setIsOpenSubMenu(!isOpenSubMenu) };
  const handledMenu = () => { setIsOpenMenu(!isOpenMenu) };
  const ref = useRef(null)
  const anotherRef = useRef(1)
  const closeMenu = () => {
    setIsOpenMenu(false)
  }
  useOutSideAlerter(ref, !isOpenMenu, closeMenu)
  let user = useParams()
  useSelector(select)
  const handleImageHiddenFN = () => {
    dispatch(
      handleImageHidden()
    )
  }
  
  return (
    <>
      {user ?
        (
          <>
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
                  title={<BsList />}
                  borderRadius='normal'
                  bgcolor={'op1'} />
                <Button
                  width={'icon32'}
                  title={<TbColumns />}
                  borderRadius='normal'
                  bgcolor={'op1'} />
                <Button
                  width={'icon32'}
                  title={<MdOutlineHideImage />}
                  borderRadius='normal'
                  bgcolor={'op1'} 
                  isActivated={}
                  onClick={() => handleImageHiddenFN()}
                  />
              </Group>

              <SideBar links={MenuData} isOpen={isOpenMenu} />




            </Container>
          </>
        )
        :
        null
      }
    </>

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
   /* ${props => {
    switch (props.borderRadius) {
      case 'bottom-right':
        return `
          border-bottom-right-radius: 20px;
          border-top-right-radius: 20px;
          margin-right: 0;
          padding-right: 0.3em;

          `

      default:
        break;
    }
  }} */
`
const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2em;
`
const Icon = styled.div`
  height: 1.3em;
  width: 1.3em;
  border-radius: 10px;
  color: white;

  display: flex;
  align-items: center;
  justify-content: center;
  justify-items: center;
  padding: 0;
  font-size: 1.4em;
  font-weight: 700;
  background-color: rgba(0, 0, 0, 0.200);
`