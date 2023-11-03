import React from 'react'
import styled from 'styled-components';

export const Option = ({ option }) => {
    return (
        <Container onClick={option?.action} isActive={option?.isActive}>
            <Header>
                {
                    option?.icon && (
                        <Icon>
                            {option?.icon}
                        </Icon>
                    )
                }

                {option?.text}

            </Header>
            {
                option?.description && (
                    <Description>
                        {option?.description}
                    </Description>
                )
            }

        </Container>
    )
}
const Container = styled.div`
width: 100%;

padding: 0.5em 1em;

    border-bottom: var(--border-primary);
    :last-child {
        border-bottom: none;
    }
:hover {
  background-color: #f2f2f2;
}
  /* Estilos para los botones de las opciones */
    ${(props) =>
            props?.isActive &&
            `
        background-color: ${props.theme.colors["primary"]["bg"]};
        color: ${props.theme.colors["primary"]["text"]};
    `}
`;
const Header = styled.div`
    display: flex;
    gap: 1em;
    align-items: center;
    height: 2em;
`
const Icon = styled.div`
    width: 1.6em;
    svg{
        color: #3f3f3f;
        font-size: 1.4em;
    }
`
const Description = styled.div`
    font-size: 13px;
    color: gray;
    padding-left: 1em;
    padding-bottom: 1em;

`