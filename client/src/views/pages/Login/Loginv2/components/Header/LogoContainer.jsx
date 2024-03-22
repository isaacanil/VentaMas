import React from 'react'
import { Logo } from '../../../../../../assets/logo/Logo'
import styled from 'styled-components'
import * as antd from 'antd'

const { Typography } = antd

export const LogoContainer = () => {
    return (
        <Container>
            <Wrapper>
                <Title
                    level={4}
                >
                    Facturación en Linea
                </Title>
                <LogoWrapper>
                    <Logo />
                </LogoWrapper>
            </Wrapper>
            ventamax
        </Container >
    )
}

const Container = styled.div`
    display: grid;
    justify-content: center;
    align-items: center;
    align-content: center;
    margin-bottom: 1.7em;
`
const Wrapper = styled.div`
    display: grid;
    grid-template-columns: min-content min-content;
    align-items: center;
    align-content: center;
    width: min-content;
    position: relative;
`

const Title = styled(Typography.Title)`
    white-space: nowrap;
    margin: 0 !important;
    padding:  0.4em 0.8em;
    padding-right: 1em;
    position: absolute;
    background-color: var(--color);
    right: 3.5em;
    color: white !important;
    border-radius: 40px 0px 0px 40px;
    @media (max-width: 600px){
        display: none;
    }

`
const LogoWrapper = styled.div`
z-index: 2;
`