import React, { useState } from 'react'
import styled from 'styled-components'
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
export const Category = ({
    item = {},
    isFavorite = false,
    searchTerm = '',
    color= '#f2f2f2',
    selected = false,
    onClick = () => {},
    toggleFavorite
}) => {
    const [isHover, setIsHover] = useState(false)
    const [isHoverFavorite, setIsHoverFavorite] = useState(false)

    const handleMouseEnter = () => setIsHover(true);
    const handleMouseLeave = () => setIsHover(false);

    const highlightMatch = (text) => {
        if (!searchTerm) return text;
        const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === searchTerm.toLowerCase()
                ? <mark key={index}>{part}</mark> : part
        );
    };

    return (
        <Container
            selected={selected}
            onMouseEnter={handleMouseEnter}
            color={color}
            onMouseLeave={handleMouseLeave}
            onClick={() => onClick(item)}
        >
            <CategoryItem>{highlightMatch(item?.name)}</CategoryItem>
            {
                toggleFavorite && (
                    <FavoriteStar
                    onMouseEnter={() => setIsHoverFavorite(true)}
                    onMouseLeave={() => setIsHoverFavorite(false)}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item)
                    }}>
                    <FontAwesomeIcon icon={isFavorite || isHoverFavorite ? faStar : faStarRegular} />
                </FavoriteStar>
                )

            }
           
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
    background-color: ${({ color }) => color};  // Usamos el color dinámico
    :hover {
        background-color: ${({ color }) => color};  // Mantén el hover del mismo color
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