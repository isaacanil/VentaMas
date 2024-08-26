import React from 'react'
import styled from 'styled-components'
import { FeatureCard } from './FeatureCard'
import * as antd from "antd"
const { Typography } = antd;
export const FeatureCardList = ({ title, cardData }) => {
    const categories = cardData.reduce((acc, card) => {
        const { category } = card;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(card);
        return acc;
    }, {});

    return (
        <Container>
            <Title level={5}>
                {title && title}
            </Title>
            <Wrapper >
                {Object.entries(categories).map(([category, cards]) => (
                    <Category key={category}>
                        <CategoryHeader>
                            {category}
                        </CategoryHeader>
                        <FeatureContainer
                            cardsCount={cards.length}
                        >
                            {cards.map((card, index) => (
                                <FeatureCard
                                    key={index}
                                    card={card}
                                />
                            ))}
                        </FeatureContainer>
                    </Category>
                ))}
            </Wrapper>
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    gap: 0.4em;
    `
const Wrapper = styled.div`
    display: grid;
    border-radius: 10px;
    grid-template-columns: repeat(auto-fit, minMax(400px, 1fr));
    gap: 0.4em;
`
const Category = styled.div`
    display: grid;
    gap: 0.6em;
    padding: 0.6em;
    align-content: start;
    background-color: var(--color3);
    border-radius: 0.4em;
`
const FeatureContainer = styled.div`
    text-decoration: none;
    display: grid;
    grid-template-columns: ${props => props.cardsCount === 1 ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))'};
    gap: 0.4em;
    list-style: none;
    padding: 0;
`
const Title = styled(Typography.Title)`
    color:  #0086df !important;
    margin: 0 !important;
`
const CategoryHeader = styled.h3`
    font-size: 0.9em;   
    margin: 0;
    color: #333;
`;