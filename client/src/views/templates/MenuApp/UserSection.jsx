import { Button } from '../system/Button/Button'
import React from 'react'
import styled from 'styled-components'
import { auth } from '../../../firebase/firebaseconfig'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../../features/auth/userSlice'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons'
import { fbSignOut } from '../../../firebase/Auth/fbAuthV2/fbSignOut'
import { useNavigate } from 'react-router-dom'
import { icons } from '../../../constants/icons/icons'
import { useDialog } from '../../../Context/Dialog/DialogContext'
import { selectBusinessData } from '../../../features/auth/businessSlice'
import * as antd from 'antd'
const { Tag } = antd
export const UserSection = ({ user }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { dialog, onClose, setDialogConfirm } = useDialog();
  const business = useSelector(selectBusinessData);
  const handleLogout = () => {
    dispatch(logout());
    fbSignOut();
    auth.signOut();
    navigate('/', { replace: true });
  }
  const logoutOfApp = () => {
    // dispatch to the store with the logout action
    setDialogConfirm({
      title: 'Cerrar sesión',
      isOpen: true,
      type: 'warning',
      message: '¿Está seguro que desea cerrar sesión?',
      onConfirm: () => {
        handleLogout()
        onClose()
      }
    })

  }
  return (
    <Container>
      <UserInfo>
        <Avatar>

          <Icon>
            <FontAwesomeIcon icon={faUser} />
          </Icon>

          <Username>{user === null ? null : <span>{user?.displayName} </span>}</Username>
        </Avatar>
        <Action>
          <Button
            startIcon={icons.operationModes.logout}
            color={'gray-contained'}

            title={'Salir'}
            size="medium"
            borderRadius='normal'
            onClick={logoutOfApp}
          />
        </Action>
      </UserInfo>
     
        <Business color='blue'>{user === null ? null : <span>{business?.name} </span>}</Business>
    

    </Container>
  )
}



const Container = styled.div`

  display: grid;
  gap: 0.6em;
    padding: 0.8em 1em;
    overflow: hidden;
  
`
const Icon = styled.div`
  background-color: var(--color2);
  max-height: 2em; 
  max-width: 2em;
  height: 2em; 
  width: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-light);
  color: #555555;

`

const UserInfo = styled.div`
 display: flex;
 gap: 0.4em;
 justify-content: space-between;
`
const Username = styled.div`
  font-weight: 600;
  color: #636262;
  text-transform: capitalize;
`
const Avatar = styled.div` 
  display: flex;
  align-items: center;
  gap: 0.5em;

`
const Business = styled(Tag)`  
white-space: nowrap;
width: 100%;
overflow: hidden;
text-overflow: ellipsis;
font-size: 14px;
padding: 0.4em 0.8em;
border-radius: var(--border-radius);

`
const Action = styled.div`
  display: flex;
  align-items: center;
  gap: 1em;
  
  justify-content: center;
`