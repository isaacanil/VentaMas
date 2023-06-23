import React from 'react'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../../../features/auth/userSlice'
import { icons } from '../../../../../constants/icons/icons'
import styled from 'styled-components'


export const UserSection = () => {
  const user = useSelector(selectUser)
  return (
    <Container>
      <Icon>
        {icons.user.user}
      </Icon>
      {user?.displayName}
    </Container>
  )
}
const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4em;

`
const Icon = styled.div`
  width: 1.6em;
  height: 1.6em;
  border-radius: 50%;
  background-color: var(--Black);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2em;
  margin-right: 0.4em;
`