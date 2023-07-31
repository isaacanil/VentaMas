import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import { selectUser } from '../../../features/auth/userSlice'
import styled from 'styled-components'
import Header from './components/Header'
import Body from './components/Body/Body'
export const Welcome = () => {
  const user = useSelector(selectUser)
  const Navigate = useNavigate()
  useEffect(() => {
    if (user) {
      Navigate('/home')
    }
  }, [user])

  return (
    <Container>
      <Header />
      <Body />
    </Container>
  )
}
const Container = styled.div`

  height: 100vh;
  width: 100%;
  display: grid;
  align-items: flex-start;
  align-content: flex-start;
  justify-items: center;
  margin: 0;
  background-color: #ffffff;
  color: #fff;
  overflow: hidden;
 
  a {
    color: #fff;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`

