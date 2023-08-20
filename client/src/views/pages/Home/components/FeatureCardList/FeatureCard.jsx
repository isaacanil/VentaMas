import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const FeatureCard = ({ card }) => {
    return (
        <Container to={card?.route}>
            <FeatureCardIcon>
                {card.icon}
            </FeatureCardIcon>
            <FeatureCardTitle>{card.title}</FeatureCardTitle>
        </Container>
    )
}
const Container = styled(Link)`
        border-radius: var(--border-radius1);
        overflow: hidden;
         /* Tus estilos para el enlace de la tarjeta de funciones aquí */
            background-color: var(--White);
            height: 4em;
          width: 100%;
          padding: 0.2em 1em;
          display:flex;
          gap: 1em;
          align-items: center;
          text-decoration: none;
`




const FeatureCardIcon = styled.div`
  /* Tus estilos para la imagen de la tarjeta de funciones aquí */
  font-size: 1.5em;
              color: var(--color);
              display: block;
`;

const FeatureCardTitle = styled.h3`
  /* Tus estilos para el título de la tarjeta de funciones aquí */
  color: rgb(32, 32, 32);
            text-align: center;
            font-weight: 500;
`;