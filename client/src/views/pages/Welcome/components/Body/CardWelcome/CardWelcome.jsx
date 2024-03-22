import React from 'react'
import styled from 'styled-components'
import { Logo } from '../../../../../../assets/logo/Logo'
import Typography from '../../../../../templates/system/Typografy/Typografy'

export const CardWelcome = ({ welcomeData }) => {
    return (
        <Container>
            <Main>
                <Typography
                    variant={"h1"}
                    size='xlarge'
                    color='primary'
                >
                    Ventamax
                </Typography>
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
            </Main>
            <LogoContainer>
                <Logo size='xxlarge' src={welcomeData.logo} alt="" />
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
max-width: 1200px;
padding: 4em;
@media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 2em;
    }
`
const Main = styled.div`
  display: grid;
  align-content: start;
  max-width: 500px;
  width: 100%;
`
const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  max-width: 700px;
  padding: 2em;
  background-image: radial-gradient(circle, #0a53b3 0%, #ffffff 50%,  white 100%);
  
 `