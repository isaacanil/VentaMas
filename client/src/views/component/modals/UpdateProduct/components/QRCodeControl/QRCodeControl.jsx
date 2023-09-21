import React from 'react'
import QRCode from 'react-qr-code';
import styled from 'styled-components';
import { InputV4 } from '../../../../../templates/system/Inputs/GeneralInput/InputV4';
import { setProduct } from '../../../../../../features/updateProduct/updateProductSlice';
import { useDispatch } from 'react-redux';
import { icons } from '../../../../../../constants/icons/icons';


export const QRCodeControl = ({ product, value }) => {
    const dispatch = useDispatch()
    return (
        <Container>
            <InputV4
                label={'Codigo QR'}
                type="number"
                value={value}
                onChange={(e) => dispatch(setProduct({ ...product, qrCode: e.target.value }))}
            />
            {
                value ?
                    (
                        <StyledQRCode
                            size={100}
                            value={value || ''}
                        />
                    ) :
                    (
                        <Icon>
                            {icons.inventory.qrcode}
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
    gap: 0.6em;
    justify-items: center;
`
const StyledQRCode = styled(QRCode)`
/* Estilos CSS aquí */


border: 2px solid black;
border-radius: 10px;
`;

const Icon = styled.div`
    width: 100%;
    height: 6.3em;
    display: flex;
    align-items: center;
    justify-content: center;
    svg{
        font-size: 4em;
    }
`