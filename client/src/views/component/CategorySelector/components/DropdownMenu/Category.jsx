import React, { useState } from 'react'
import styled from 'styled-components'
import { icons } from '../../../../../constants/icons/icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
export const Category = ({
    category = {},
    isFavorite = false,
    searchTerm = '',
    selected = false,
    onClick = () => { },
    toggleFavoriteCategory = () => { }
}) => {
    const [isHover, setIsHover] = useState(false)
    const [isHoverFavorite, setIsHoverFavorite] = useState(false)
    const handleMouseEnter = () => {
        setIsHover(true);
    };

    const handleMouseLeave = () => {
        setIsHover(false);
    };

    const highlightMatch = (text) => {
        if (!searchTerm) return text;
        const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
        return parts.map((part, index) => 
            part.toLowerCase() === searchTerm.toLowerCase() ? <mark key={index}>{part}</mark> : part
        );
    };

    return (
        <Container
            selected={selected}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <CategoryItem onClick={() => onClick(category)} >
            {highlightMatch(category?.name)}
            </CategoryItem>
            {/* {
                selected && (
                    <DeleteButton>
                        {icons.editingActions.cancel}
                    </DeleteButton>
                )
            } */}
            <FavoriteStar 
                onMouseEnter={() => setIsHoverFavorite(true)}
                onMouseLeave={() => setIsHoverFavorite(false)}
            onClick={() => toggleFavoriteCategory(category)}>
                <FontAwesomeIcon icon={isFavorite || isHoverFavorite ? faStar :  faStarRegular} />
            </FavoriteStar>
        </Container>
    )
}
const Container = styled.div`
    display: grid;
    grid-template-columns: 1fr min-content min-content;
    justify-content: space-between;
    padding: 0em 0.4em;
    border-radius: 0.4em;
    cursor: pointer;
    border: 2px solid transparent;
    background-color: var(--White1);
    :hover{
        background-color: var(--White4);
    }
    ${props => props.selected && `
        border: 2px solid var(--color1);
        background-color: var(--color2);
    `}
    
`;
const DeleteButton = styled.span`
    height: 1.2em;
    width: 1.2em;
    display: flex;
    align-items: center;
`       
const CategoryItem = styled.span`
    padding: 0.4em 0.4em;
    height: 100%;
`;
const FavoriteStar = styled.span`
    /* estilos para la estrella favorita */
    height: 100%;
    display: flex;
    align-items: center;
    margin-left: 10px;
    cursor: pointer;
    svg{
        color: #ffd900;
        font-size: 1.2em;
    }
`;