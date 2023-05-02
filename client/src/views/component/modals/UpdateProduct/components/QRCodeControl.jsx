import React from 'react'
import QRCode from 'react-qr-code';
import styled from 'styled-components';

export const QRCodeControl = ({value}) => {
    return (
        <Container>
            <StyledQRCode
                size={100}
                value={value}
            />
        </Container>
    )
}
const Container = styled.div`
height: 100%;
width: 100%;
display: grid;
    align-items: center;
    justify-content: right;
    justify-items: right;
`
const StyledQRCode = styled(QRCode)`
/* Estilos CSS aquí */


border: 2px solid black;
border-radius: 10px;
`;