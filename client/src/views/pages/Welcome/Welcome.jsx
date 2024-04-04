import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import { selectUser } from '../../../features/auth/userSlice'
import styled from 'styled-components'
import Header from './components/Header'
import Body from './components/Body/Body'
import ROUTES_PATH from '../../../routes/routesName'
import { Footer } from './components/Footer/Footer'

export const Welcome = () => {
  const user = useSelector(selectUser)
  const { HOME } = ROUTES_PATH.BASIC_TERM
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate(HOME);
    }
  }, [user]);
  return (
    <Container>
      <Header />
      <Body />
      <Footer />
    </Container>
  )
}
const Container = styled.div`

  height: 100vh;
  width: 100%;
  display: grid;
  align-items: flex-start;
  align-content: flex-start;
 
  margin: 0;
  background-color: #ffffff;
  color: #fff;
 
  a {
    color: #fff;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`

