import React from 'react'
import Barcode from 'react-barcode'
import styled from 'styled-components'
import { InputV4 } from '../../../../../templates/system/Inputs/GeneralInput/InputV4'
import { useDispatch } from 'react-redux'
import { setProduct } from '../../../../../../features/updateProduct/updateProductSlice'
import { icons } from '../../../../../../constants/icons/icons'

export const BarCodeControl = ({ product, value }) => {
    const dispatch = useDispatch()
    return (
        <Container>
            <InputV4
                label={'Codigo de Barra'}
                value={value}
                onChange={(e) => dispatch(setProduct({ ...product, barCode: e.target.value }))}
            />
            {
                value ? (
                    <StyledBarcode
                        height={60}
                        width={1.4}
                        value={value || ''}
                    />
                ) : (
                    <Icon>
                        {icons.inventory.barcode}
                    </Icon>
                )
            }

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

const StyledBarcode = styled(Barcode)`
/* Estilos CSS aquí */
height: 3em;
width: 100%;
`
const Icon = styled.div`
    width: 100%;
    height: 6.4em;
    display: flex;
    align-items: center;
    justify-content: center;
    svg{
        font-size: 4em;
    }
`