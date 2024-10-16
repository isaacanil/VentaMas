import React from 'react'
// import { Button } from '../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../templates/system/Button/ButtonGroup'
import WelcomeData from '../WelcomeData.json'
import styled from 'styled-components'
import ROUTES_NAME from '../../../../routes/routesName'
import { useMatchRouteByName } from '../../../templates/MenuApp/GlobalMenu/useMatchRouterByName'
import { useNavigate } from 'react-router-dom'
import findRouteByName from '../../../templates/MenuApp/findRouteByName'
import * as ant from 'antd'
const { Button } = ant;
const Header = () => {
    const { LOGIN, SIGNUP } = ROUTES_NAME.AUTH_TERM

    const loginPath = LOGIN
    const signupPath = SIGNUP
    const navigate = useNavigate()
    const handleNavigate = (path) => {
        navigate(path)
    }

    return (
        <Head>
            <Group>
                <WebName>{WelcomeData.webName}</WebName>

                {/* <Logo src={WelcomeData.logo} alt="" /> */}
            </Group>
            <Group>
                <ButtonGroup>
                    <Button
                        onClick={() => {
                            handleNavigate(loginPath)
                        }
                        }
                    >
                        Iniciar sesión
                    </Button>
                
                </ButtonGroup>
            </Group>
        </Head>
    )
}

export default Header

const Head = styled.div`
  display: flex;
  align-items: center;
  height: 2.2em;
  width: 100%;
  gap: 1em;
  font-size: 25px;
  padding: 0 1em;
  justify-content: space-between;
  background-color: var(--color) ;
`
const Group = styled.div`
  display: flex;
  color: white;
`
const Logo = styled.img`
    height: 2em;
    width: 2em;
    margin: 0;
    padding: 0;
    display: block;

`
const WebName = styled.div`
    font-size: 1.2em;
    font-weight: 700;
    margin: 0;
    color: white;
    @media (max-width: 800px) {
        font-size: 1em;
        text-align: center;
    }
`
