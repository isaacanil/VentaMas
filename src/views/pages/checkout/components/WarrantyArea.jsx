import React from 'react'
import styled from 'styled-components'

import { SubTitle } from '../Receipt'


export const WarrantyArea = ({ data }) => {
    const someProductHaveWarranty = data.products.some((product) => product?.warranty?.status)

    if (someProductHaveWarranty) {
        return (
            <Container>
                <SubTitle>
                    Garantía
                </SubTitle> 
            </Container>
        )
    }
}

const Container = styled.div`
    padding: 1em 0;
    
`