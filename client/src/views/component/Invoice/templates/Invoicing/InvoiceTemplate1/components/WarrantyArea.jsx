import React from 'react'
import { useSelector } from 'react-redux'
import { SelectSettingCart } from '../../../../features/cart/cartSlice'
import { SubTitle } from '../Receipt'
import styled from 'styled-components'
import { convertTimeToSpanish } from '../../../component/modals/ProductForm/components/sections/WarrantyInfo'


export const WarrantyArea = ({ data }) => {
    const { printWarranty } = useSelector(SelectSettingCart)
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