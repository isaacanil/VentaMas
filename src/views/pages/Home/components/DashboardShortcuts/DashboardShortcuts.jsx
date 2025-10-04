import React from 'react'
import { userAccess } from '../../../../../hooks/abilities/useAbilities';
import { FeatureCardList } from '../FeatureCardList/FeatureCardList';
import { getDeveloperFeaturesData, getMenuCardData } from '../../CardData';
import { selectUser } from '../../../../../features/auth/userSlice';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

export const DashboardShortcuts = () => {
    const user = useSelector(selectUser)
    const cardData = getMenuCardData(user)
    const developer = getDeveloperFeaturesData(user)
    const { abilities } = userAccess();
    return (
        <Container>
            {abilities?.can('developerAccess', 'all') && (
                <FeatureCardList
                    title={"Funciones de desarrollador"}
                    cardData={developer}
                />
            )}
            <FeatureCardList
                title={"Atajos"}
                cardData={cardData}
            />
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    gap: 1em;
    max-width: 1440px;
    width: 100%;
    margin: 0 auto;
  
    
    @media (max-width: 768px) {
        gap: 0.8em;
    }
`