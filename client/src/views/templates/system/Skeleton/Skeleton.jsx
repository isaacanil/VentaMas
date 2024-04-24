import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import styled, { css, keyframes } from 'styled-components';

export const Skeleton = ({
    loading = true,
    children
}) => {
    const [show, setShow] = useState(false)
    
    useEffect(() => {
        if (loading) {
            setShow(false)
        } else {
            setTimeout(() => {
                setShow(true)
            }
                , 3000)
        }
    }, [loading])
    return (
        <Container
            loading={show}
        >
            <Wrapper
                loading={show}
            >
                <Hide
                    loading={show}
                >
                    {children}
                </Hide>
            </Wrapper>
        </Container>
    )
}
const fade = keyframes`
  0%, 100% {
    background-color: #eeeeee;}
  50% { 
    background-color: #cecece;
    }
`;
const Container = styled.div`
    display: grid;
 
    
    border-radius: var(--border-radius);
    /* border: var(--border1); */
    /* background-color: white; */
    position: relative;
`
const Wrapper = styled.div`
    display: grid;
  
    border-radius: var(--border-radius);
    
    z-index: 1;
    ${({ loading }) => !loading ? css`animation: ${fade} 3s ease-in-out infinite;` : 'animation: none;'}
`

const Hide = styled.div`
    display: 'grid';
  
    border-radius: var(--border-radius);
    ${({ loading }) => loading ? '' : 'visibility: hidden;'}
   
    transition: visibility  0.5s ease-in-out; 
    z-index: 2;
`

