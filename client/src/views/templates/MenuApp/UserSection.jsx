import { Button } from '../system/Button/Button'
import React from 'react'
import { FaUser } from 'react-icons/fa'
import styled from 'styled-components'
import { auth } from '../../../firebase/firebaseconfig'
import { useDispatch } from 'react-redux'
import { logout } from '../../../features/auth/userSlice'

export const UserSection = ({ user }) => {
  const dispatch = useDispatch()
  const logoutOfApp = () => {
    // dispatch to the store with the logout action
    dispatch(logout());
    auth.signOut();
  }
  return (
    <Container>
      <Group>
        <Icon>
          <FaUser></FaUser>
        </Icon>
        <span>{user === null ? null : <span>{user.displayName}</span>}</span>
      </Group>
      <Group>
        <Button
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
    
    border-radius: 10px;
    span{
      font-weight: 600;
      color: white;
      text-transform: capitalize;
    }
`
const Icon = styled.div`
  background-color: rgb(41, 41, 41);
  max-height: 2em; 
  max-width: 2em;
  height: 2em; 
  width: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: white;

`
const Group = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  
`