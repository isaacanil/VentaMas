import React from 'react'
import { useSelector } from 'react-redux'
import { SelectSettingCart } from '../../../../features/cart/cartSlice'
import { SubTitle } from '../Receipt'
import styled from 'styled-components'
import { convertTimeToSpanish } from '../../../component/modals/ProductForm/components/sections/WarrantyInfo'


export const WarrantyArea = ({ data }) => {
    const { printWarranty } = useSelector(SelectSettingCart)
    const someProductHaveWarranty = data.products.some((product) => product?.warranty?.status)

    if (printWarranty && someProductHaveWarranty) {
        return (
            <Container>
                <SubTitle>
                    Garantía
                </SubTitle>
                <p>
                    Productos con Garantía
                </p>
                {
                    data?.products.map((product)=>{
                        const haveWarranty = product?.warranty?.status
                        if(haveWarranty){
                            return (
                                <div>
                                    <div>
                                     - Producto: {product?.name} - Duración: {convertTimeToSpanish(product?.warranty?.quantity, product?.warranty?.unit)}
                                    </div>
                                    {/* <div>
                                        Duración: 
                                    </div> */}
                                </div>
                            )
                        }
                    })
                }
               
            </Container>
        )
    }
}

const Container = styled.div`
    padding: 1em 0;
    
`