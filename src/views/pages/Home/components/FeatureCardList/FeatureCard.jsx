import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { toggleDeveloperModal } from '../../../../../features/modals/modalSlice'

export const FeatureCard = ({ card }) => {
    const dispatch = useDispatch();

    const handleClick = (e) => {
        if (card.action) {
            e.preventDefault();
            
            switch (card.action) {
                case 'openDeveloperModal':
                    dispatch(toggleDeveloperModal());
                    break;
                default:
                    console.warn(`Action not implemented: ${card.action}`);
            }
        }
    };

    const CardContent = (
        <>
            <FeatureCardIcon>
                {card.icon}
            </FeatureCardIcon>
            <FeatureCardTitle>{card.title}</FeatureCardTitle>
        </>
    );

    // Si tiene una acción personalizada, usar un div en lugar de Link
    if (card.action) {
        return (
            <ActionContainer onClick={handleClick}>
                {CardContent}
            </ActionContainer>
        );
    }

    // Si tiene una ruta, usar Link
    return (
        <Container to={card?.route}>
            {CardContent}
        </Container>
    )
}
const Container = styled(Link)`
    border-radius: 8px;
    overflow: hidden;
    background-color: #fff;
    min-height: 3em;
    border: 1px solid #eaeaea;
    width: 100%;
    padding: 0.6em 1em;
    display: grid;
    grid-template-columns: min-content 1fr;
    gap: 0.8em;
    align-items: center;
    text-decoration: none;
    transition: all 0.2s ease-in-out;

    &:hover {
        background-color: #f8f9fa;
        border-color: #0086df;
    }
`

const ActionContainer = styled.div`
    border-radius: 8px;
    overflow: hidden;
    background-color: #fff;
    min-height: 3em;
    border: 1px solid #eaeaea;
    width: 100%;
    padding: 0.6em 1em;
    display: grid;
    grid-template-columns: min-content 1fr;
    gap: 0.8em;
    align-items: center;
    text-decoration: none;
    transition: all 0.2s ease-in-out;
    cursor: pointer;

    &:hover {
        background-color: #f8f9fa;
        border-color: #0086df;
    }
`;

const FeatureCardIcon = styled.div`
    font-size: 1.3em;
    width: 1.3em;
    height: 1.3em;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0086df;
`;

const FeatureCardTitle = styled.span`
    color: #2c3e50;
    font-size: 0.95em;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${Container}:hover & {
        color: #0086df;
    }
`;