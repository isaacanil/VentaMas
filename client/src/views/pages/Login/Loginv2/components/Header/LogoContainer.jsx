import React from 'react'
import { Logo } from '../../../../../../assets/logo/Logo'
import styled from 'styled-components'
import * as antd from 'antd'

const { Typography } = antd

export const LogoContainer = () => {
    return (
        <Container>
            <Header>
                <Wrapper>
                    <Title
                        level={4}
                    >
                        Facturación en Línea
                    </Title>
                    <LogoWrapper>
                        <Logo />
                    </LogoWrapper>
                </Wrapper>
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
        </Container >
    )
}

const Container = styled.div`
    display: grid;
    justify-content: center;
    align-items: center;
    align-content: center;
    margin-bottom: 1.5em;
`
const Wrapper = styled.div`
    display: grid;
    grid-template-columns: min-content min-content;
    align-items: center;
    align-content: center;
    width: min-content;
   
    position: relative;
`
const Header = styled.div`
    display: grid;
    width: 100%;
    justify-content: center;
    width: 100%;
    position: relative;
    gap: 0.2em;
    margin-bottom: 1.7em;
`

const Title = styled(Typography.Title)`
    white-space: nowrap;
    margin: 0 !important;
    padding:  0.4em 0.8em;
    padding-right: 5em;
    position: absolute;
    background-color: var(--color);
    right: 3.5em;
    color: white !important;
    border-radius: 40px 0px 0px 40px;
    @media (max-width: 900px){
        padding-right: 2em;
    }
    @media (max-width: 800px){
        display: none;
        align-items:  center;
    }

`
const LogoWrapper = styled.div`
    z-index: 2;
`
const AppName = styled.div`
    font-size: 1.2em;
    font-weight: 700;
   
    color: white;
    @media (max-width: 600px){
        text-align:  center;
    }
`
const IntroText = styled.div`
    font-size: 1.1em;
    color: white;
    @media (max-width: 600px){
        text-align:  center;
    }
`
const WelcomeTitle = styled(Typography.Title)`
    color: var(--color) !important;
    font-size: 1.6em; // Adjust the font size as needed
    margin-top: 0.5em;
    @media (max-width: 600px){
        text-align:  center;
    }
`
