import { Button } from '../system/Button/Button'
import React from 'react'
import { FaUser } from 'react-icons/fa'
import styled from 'styled-components'
import { auth } from '../../../firebase/firebaseconfig'
import { useDispatch } from 'react-redux'
import { logout } from '../../../features/auth/userSlice'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons'
import { fbSignOut } from '../../../firebase/Auth/fbAuthV2/fbSignOut'
import { useNavigate } from 'react-router-dom'

export const UserSection = ({ user }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const logoutOfApp = () => {
    // dispatch to the store with the logout action
    dispatch(logout());
    fbSignOut();
    auth.signOut();
    navigate('/', { replace: true });
  }
  return (
    <Container>
      <Group>
        <Icon>
          <FontAwesomeIcon icon={faUser} />
        </Icon>
        <span>{user === null ? null : <span>{user.displayName}</span>}</span>
      </Group>
      <Group>
        <Button
          bgcolor={'primary'}
          title={'Cerrar Sección'}
          borderRadius='normal' 
          onClick={logoutOfApp}
          />
      </Group>
    </Container>
  )
}



const Container = styled.div`
  display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1em;
    margin-bottom: 0.6em;
    
    
    span{
      font-weight: 600;
      color: #636262;
      text-transform: capitalize;
    }
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
const Group = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  
`