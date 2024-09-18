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
            <Title level={4}>
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
    gap: 0.6em;
    background-color: #fff;
    padding: 1em;
    border-radius: 8px;
    `
const Wrapper = styled.div`
    display: grid;
    border-radius: 10px;
    grid-template-columns: repeat(auto-fit, minMax(300px, 1fr));
    gap: 1.2em 0.6em;
`
const Category = styled.div`
    display: grid;
    gap: 0.6em;
    padding: 0em;
    align-content: start;

    border-radius: 0.4em;
`
const FeatureContainer = styled.div`
    text-decoration: none;
    display: grid;
    grid-template-columns: ${props => props.cardsCount === 1 ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))'};
    gap: 0.6em;
    list-style: none;
    padding: 0;
`
const Title = styled(Typography.Title)`
    color:  #0086df !important;
    margin: 0 !important;
`
const CategoryHeader = styled.span`
    font-size: 1em;  
    font-weight: 500; 
    margin: 0;
    color: #333;
`;