import React from 'react'
import styled from 'styled-components'
import { auth } from '../../../firebase/firebaseconfig'
import { useDispatch, useSelector } from 'react-redux'
import { logout, selectUser } from '../../../features/auth/userSlice'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { fbSignOut } from '../../../firebase/Auth/fbAuthV2/fbSignOut'
import { useNavigate } from 'react-router-dom'
import { useDialog } from '../../../Context/Dialog/DialogContext'
import { selectBusinessData } from '../../../features/auth/businessSlice'
import * as antd from 'antd'
const { Tag } = antd

export const UserSection = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { dialog, onClose, setDialogConfirm } = useDialog();
  const business = useSelector(selectBusinessData);
  const user = useSelector(selectUser)

  const handleLogout = () => {
    dispatch(logout());
    fbSignOut();
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
  const getDisplayName = (user) => {
    return user?.displayName && user.displayName.trim() !== '' ? user.displayName : user?.username
  }

  const getInitial = (name) => {
    const n = (name || '').trim()
    return n ? n.charAt(0).toUpperCase() : 'U'
  }

  return (
    <Container role="group" aria-label="Usuario">
      <Left>
        <AvatarCircle aria-hidden>
          {getInitial(getDisplayName(user) || user?.email || 'Usuario')}
        </AvatarCircle>
        <Info>
          <Username title={getDisplayName(user) || 'Usuario'}>
            {getDisplayName(user) || 'Usuario'}
          </Username>
          <BusinessPill color="blue">
            <span>{business?.name || 'Negocio'}</span>
          </BusinessPill>
        </Info>
      </Left>
      <Action>
        <IconButton
          type="button"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          onClick={logoutOfApp}
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </IconButton>
      </Action>
    </Container>
  )
}



const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8em;
  padding: 0.8em 1em;
  border-radius: var(--border-radius);
  background: #fff;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
`

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8em;
  min-width: 0; /* enable text truncation */
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25em;
  min-width: 0;
`

const Username = styled.div`
  font-weight: 600;
  color: #1f1f1f;
  text-transform: capitalize;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const AvatarCircle = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #7C4DFF 0%, #8E2DE2 100%);
  flex: none;
  user-select: none;
`

const BusinessPill = styled(Tag)`
  white-space: nowrap;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 9999px;
  align-self: flex-start;

  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const Action = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  background: #ffffff;
  color: #595959;
  cursor: pointer;
  transition: all 0.15s ease-in-out;

  &:hover {
    background: #f5f5f5;
    color: #262626;
  }

  &:active {
    transform: translateY(0.5px);
  }

  &:focus-visible {
    outline: 2px solid #7C4DFF;
    outline-offset: 2px;
  }
`