import React from 'react'
import styled from 'styled-components'
import { Button } from '../../templates/system/Button/Button'

export const ProductInventoryCard = () => {
    return (
        <Container>
            <Head>
                <Button color='editar' >Editar</Button>
                <Button color='error' >X</Button>
            </Head>
   
        </Container>
    )
}
const Container = styled.div`
 
    background-color: #b31717;
    border: 1px solid rgba(0, 0, 0, 0.068);
    padding: 0.4em;
    border-radius: 8px;
    display: grid;
    grid-template-rows: min-content 1fr;
    gap: 1em;
   
`
const Head = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`
