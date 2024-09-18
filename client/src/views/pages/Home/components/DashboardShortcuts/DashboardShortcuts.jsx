import React from 'react'
import { userAccess } from '../../../../../hooks/abilities/useAbilities';
import { FeatureCardList } from '../FeatureCardList/FeatureCardList';
import { getDeveloperFeaturesData, getMenuCardData } from '../../CardData';
import { selectUser } from '../../../../../features/auth/userSlice';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

export const DashboardShortcuts = () => {
    const user = useSelector(selectUser)
    const cardData = getMenuCardData()
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
    gap: 1.4em;
    
    `