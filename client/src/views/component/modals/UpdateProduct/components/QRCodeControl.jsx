import React from 'react'
import QRCode from 'react-qr-code';
import styled from 'styled-components';
import { InputV4 } from '../../../../templates/system/Inputs/InputV4';

export const QRCodeControl = ({value}) => {
    return (
        <Container>
             <InputV4
                label={'Codigo de Barra'}
                type="number"
                value={value}
                onChange={(e) => dispatch(setProduct({ ...product, barCode: e.target.value }))}
            />
            <StyledQRCode
                size={100}
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
    gap: 0.6em;
    justify-items: center;
`
const StyledQRCode = styled(QRCode)`
/* Estilos CSS aquí */


border: 2px solid black;
border-radius: 10px;
`;