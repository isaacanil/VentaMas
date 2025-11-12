import { Button } from 'antd'
import { motion } from 'framer-motion'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import ROUTES_NAME from '../../../../routes/routesName'
import { ButtonGroup } from '../../../templates/system/Button/ButtonGroup'
import WelcomeData from '../WelcomeData.json'


const Header = () => {
    const { LOGIN } = ROUTES_NAME.AUTH_TERM
    const navigate = useNavigate()
    
    const handleNavigate = (path) => {
        navigate(path)
    }

    const headerVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    }

    return (
        <Head
            as={motion.div}
            variants={headerVariants}
            initial="hidden"
            animate="visible"
        >
            <Group>
                <WebName>{WelcomeData.webName}</WebName>
            </Group>
            <Group>
                <ButtonGroup>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => handleNavigate(LOGIN)}
                    >
                        Iniciar sesión
                    </Button>
                    {/* <Button
                        size="large"
                        onClick={() => handleNavigate(SIGNUP)}
                    >
                        Registrarse
                    </Button> */}
                </ButtonGroup>
            </Group>        </Head>
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
  background: linear-gradient(135deg, var(--color, #1890ff) 0%, #40a9ff 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
  
  @media (max-width: 768px) {
    padding: 0 1em;
    font-size: 20px;
    height: 60px;
  }
`

const Group = styled.div`
  display: flex;
  color: white;
  align-items: center;
  gap: 12px;
`

const WebName = styled.div`
  font-size: 1.1em;
  font-weight: 700;
  margin: 0;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    font-size: 1.2em;
  }
    @media (max-width: 480px) {
    font-size: 1em;
  }
`
