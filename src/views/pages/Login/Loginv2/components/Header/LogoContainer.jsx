import * as antd from 'antd'
import React from 'react'
import styled from 'styled-components'

import { Logo } from '../../../../../../assets/logo/Logo'

const { Typography } = antd

export const LogoContainer = () => {
    return (
        <Container>
            <Header>
                <LogoBadge>
                    <Title level={4}>
                        Facturación en Línea
                    </Title>
                    <LogoWrapper>
                        <Logo />
                    </LogoWrapper>
                </LogoBadge>
                <AppName>
                    VENTAMAX
                </AppName>
            </Header>
            <WelcomeTitle>
                Bienvenido
            </WelcomeTitle>
            <IntroText>
                Lleva tu negocio siguiente nivel con nuestro sistema de punto de facturación fácil de utilizar y muy rápido.
            </IntroText>
        </Container>
    )
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin-bottom: 1em;
    width: 100%;
`

const LogoBadge = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5em;
    width: fit-content;
`

const Header = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-bottom: 1em;
`

const Title = styled.div`
    white-space: nowrap;
    margin: 0 !important;
    font-size: 1.2em !important;
    padding: 0.4em 1.2em;
    padding-right: 3em;
    background-color: var(--color);
    color: white !important;
    border-radius: 40px 0px 0px 40px;
    position: absolute;
    right: 3em;
    
    @media (max-width: 900px){
        padding-right: 2em;
    }
    @media (max-width: 800px){
        display: none;
    }
`

const LogoWrapper = styled.div`
    z-index: 2;
    display: flex;
    justify-content: center;
`

const AppName = styled.span`
    font-size: 1.5em;
    margin: 0em 0;
    font-weight: 700;
    text-align: center;
    color: white;
    letter-spacing: 1px;
`
const IntroText = styled.div`
    font-size: 1.1em;
    color: white;
    @media (max-width: 600px){
        text-align:  center;
    }
`
const WelcomeTitle = styled.div`
    color: var(--color) !important;
    font-size: 2em !important; // Adjust the font size as needed
    font-weight: 600 !important;
    margin: 0em 0 1em;
    @media (max-width: 600px){
        text-align:  center;
    }
`
