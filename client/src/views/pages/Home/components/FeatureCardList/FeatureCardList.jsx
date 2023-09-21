import React from 'react'
import styled from 'styled-components'
import { FeatureCard } from './FeatureCard'

export const FeatureCardList = ({cardData}) => {
    return (
        <Container>
            {cardData.map((card, index) => (
                <FeatureCard 
                    key={index}
                card={card} 
                />
            ))}
        </Container>
    )
}
const Container = styled.div`
   text-decoration: none;
        display: grid;
        grid-template-columns: repeat(auto-fill, minMax(250px, 1fr));
        gap: 1em;
        list-style: none;
        padding: 0;
`