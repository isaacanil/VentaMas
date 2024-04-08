import React from 'react'
import styled from 'styled-components'
import { Logo } from '../../../../../../assets/logo/Logo'
import Typography from '../../../../../templates/system/Typografy/Typografy'
import * as ant from 'antd'
import { useNavigate } from 'react-router-dom'
const { Button } = ant;

export const CardWelcome = ({ welcomeData }) => {
    const loginPath = '/login'
    const navigate = useNavigate()
    const handleNavigate = (path) => {
        navigate(path)
    }
    return (
        <Container>
            <Main>

                <AppName
                    variant={"h1"}
                    size='xlarge'
                    
                    context={"web"}
                    color='primary'
                >
                    Ventamax
                </AppName>

                <br />
                <Typography
                    variant={"h2"}
                >
                    Punto de venta
                </Typography>
                <Typography
                    variant={"body1"}
                >
                    Eleva tu negocio al siguiente nivel con herramientas avanzadas, análisis profundos y soporte especializado. Si eres un profesional en ventas, Ventamax Pro es para ti.
                </Typography>
                <br />
                <div>

                    <Button
                        type='primary'
                        size='large'
                        onClick={() => {
                            handleNavigate(loginPath)
                        }}
                    >
                        Iniciar sesión
                    </Button>
                </div>
            </Main>
            <LogoContainer>
                <LogoBG>
                    <Logo size='xlarge' src={welcomeData.logo} alt="" />
                </LogoBG>
            </LogoContainer>
        </Container>

    )
}
const Container = styled.div`
display: grid;
grid-template-columns: 1fr min-content;
min-height: 350px;
width: 100%;
gap: 2em;
max-width: 1300px;
padding: 4em;
@media (max-width: 800px) {
    grid-template-columns: 1fr;
    padding: 2em;
    }
`
const Main = styled.div`
  
 display: grid;
  max-width: 600px;
  width: 100%;
  @media (max-width: 800px){
    order:2;
    max-width: none;
  }
`
const AppName = styled(ant.Typography.Title)`
   color: var(--color) !important;
   font-weight: 700;
`
const LogoContainer = styled.div`
  width: 100%;
  max-width: 700px;
  display: flex;
  justify-content: center;
 `
const LogoBG = styled.div`
 display: flex;
 align-items: center;
 justify-content: center;
 max-width: 700px;
 padding: 2em;
`