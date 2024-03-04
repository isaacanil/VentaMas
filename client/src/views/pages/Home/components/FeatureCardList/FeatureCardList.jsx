import React from 'react'
import styled from 'styled-components'
import { FeatureCard } from './FeatureCard'
import * as antd from "antd"
const { Typography } = antd;
export const FeatureCardList = ({ title, cardData }) => {
    return (
        <Container>
            <Title level={5}>
                {title && title}
            </Title>
            <FeatureContainer>
                {cardData.map((card, index) => (
                    <FeatureCard
                        key={index}
                        card={card}
                    />
                ))}
            </FeatureContainer>
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    gap: 0.6em;
`
const FeatureContainer = styled.div`
    text-decoration: none;
        display: grid;
        grid-template-columns: repeat(auto-fill, minMax(250px, 1fr));
        gap: 0.8em;
        list-style: none;
        padding: 0;

`
const Title = styled(Typography.Title)`
    color:  #0086df !important;
`