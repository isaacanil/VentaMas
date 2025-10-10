import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as antd from "antd"
import React from 'react'
import styled from 'styled-components'

import { FeatureCard } from './FeatureCard'

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

    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <Container>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', }}>
                <Title level={4}>
                    {title && title}
                </Title>
                <antd.Button 
                    type="text"
                    icon={isCollapsed ? 
                        <FontAwesomeIcon icon={faChevronDown} size="lg" /> : 
                        <FontAwesomeIcon icon={faChevronUp} size="lg" />
                    }
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    style={{ color: '#2c3e50' }}
                />
            </div>
            {!isCollapsed && (
                <Wrapper>
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
            )}
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    gap: 0.8em;
    background-color: #fff;
    padding: 1em;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
`

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.8em;
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`

const Category = styled.div`
    display: grid;
    gap: 0.2em;
    padding: 0.6em;
    align-content: start;
    border-radius: 8px;
    background-color: #fafafa;
`

const FeatureContainer = styled.div`
    display: grid;
    grid-template-columns: ${props => props.cardsCount === 1 ? '1fr' : 'repeat(auto-fit, minmax(230px, 1fr))'};
    gap: 0.4em;
`

const Title = styled(Typography.Title)`
    color: #2c3e50 !important;
    margin: 0 !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
`

const CategoryHeader = styled.span`
    font-size: 1em;
    font-weight: 600;
    color: #34495e;
    padding: 0 0.4em;
`;