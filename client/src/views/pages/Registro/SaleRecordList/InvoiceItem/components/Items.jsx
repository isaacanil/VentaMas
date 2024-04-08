import React from 'react'
import styled from 'styled-components';
import useViewportWidth from '../../../../../../hooks/windows/useViewportWidth';
export const Items = ({ label, value, align, abbreviate }) => {
    const vw = useViewportWidth();
    return (
        <Container
            align={align}
        >
            <p>{vw > 800 && abbreviate ? label : abbreviate ? abbreviate : label} {(label || abbreviate) && ": "}</p>
            <p>{value}</p>
        </Container>
    )
}

const Container = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.8em;
    p {
        margin: 0;
        &:nth-child(1) {
        font-weight: 600;
    }
    }

    :not(:first-child):not(:last-child) {
        justify-content: center;
    }
    :first-child {
        justify-content: flex-start;
    }
    :last-child {
        justify-content: flex-end;
    }
   
    /* ${({ align }) => align === 'right' && `
         
        justify-content: flex-end;
        
    `}
    ${({ align }) => align === 'center' && `
         
         justify-content: center;
         
     `} */
    @media (max-width: 500px) {
        
        display: grid;
       
    }
    @media (max-width: 600px) {

        grid-template-columns: 1fr;
        margin: 0;
        gap: 0em;
    }
`;