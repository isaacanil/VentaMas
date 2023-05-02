import React from 'react'
import Barcode from 'react-barcode'
import styled from 'styled-components'
import { InputV4 } from '../../../../templates/system/Inputs/InputV4'
import { useDispatch } from 'react-redux'
import { setProduct } from '../../../../../features/updateProduct/updateProductSlice'

export const BarCodeControl = ({ product, value }) => {
    const dispatch = useDispatch()
    return (
        <Container>
            <InputV4
                label={'Codigo de Barra'}
                type="number"
                value={value}
                
                onChange={(e) => dispatch(setProduct({ ...product, barCode: e.target.value }))}
            />
            <BarCode
                
                height={60}
                width={1.4}
                value={value}
            />
        </Container>
    )
}
const Container = styled.div`
    width: 100%;
    display: grid;
    align-items: center;
    justify-content: center;
    justify-items: center;
`

const BarCode = styled(Barcode)`
/* Estilos CSS aquí */
height: 3em;
width: 100%;
`