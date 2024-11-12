import React, { Fragment } from 'react'
import styled from 'styled-components'
import { ProductList } from './components/ProductList'
import { PaymentArea } from './components/PaymentArea'
import { Row } from './components/Table/Row'
import { useSelector } from 'react-redux'
import { selectBusinessData } from '../../../features/auth/businessSlice'
import { Header } from './components/Header/Header'
import { WarrantySignature } from './components/WarrantySignature'
import { ReceiptComponent } from './Style'
import { ThankYouMessage } from './components/ThankYouMessage'


export const Receipt = React.forwardRef(({ data, ignoreHidden }, ref) => {
      const business = useSelector(selectBusinessData) || ""
    function getReceiptInfo(code) {
        if (!code) {
            return { type: 'Desconocido', description: 'RECIBO  DE PAGO' };
        }

        // Asegurarse de que se extrae correctamente el código relevante de la cadena
        const pattern = /(B0\d)/; // Esta expresión regular busca el patrón exacto "B0" seguido de un dígito
        const found = code.match(pattern);

        const receiptTypes = {
            B01: { type: 'Crédito Fiscal', description: 'FACTURA PARA CREDITO FISCAL' },
            B02: { type: 'Consumidor Final', description: 'FACTURA PARA CONUMIDOR FINAL' },
            // ... include other receipt types with their corresponding information
        };

        if (found && found[0] && receiptTypes[found[0]]) {
            return receiptTypes[found[0]];
        } else {
            return { type: 'Desconocido', description: 'RECIBO DE PAGO' };
        }
    }

    const ncfType = getReceiptInfo(data?.NCF)?.description

    return (
        data ? (
           <ReceiptComponent.HiddenPrintWrapper ignoreHidden={ignoreHidden} >
                <ReceiptComponent.Container ref={ref}>
                    <Header
                        data={data}
                        Space={Space}
                        SubTitle={SubTitle}
                        P={P}
                    />
                    <Space />
                    <Line />
                    <Row space>
                        <SubTitle align='center'> {ncfType}</SubTitle>
                    </Row>
                    <Line />
                    <Row cols='3' space>
                        <P>DESCRIPCION</P>
                        <P align="right">ITBIS</P>
                        <P align="right">VALOR</P>
                    </Row>
                    <Line />
                    <ProductList data={data} />
                    <Line />
                    <PaymentArea P={P} data={data} />
                    <WarrantySignature data={data} />
                    <ThankYouMessage message={business?.invoice?.invoiceMessage} />
                    {/* <WarrantyArea data={data} /> */}
                </ReceiptComponent.Container>
        </ReceiptComponent.HiddenPrintWrapper>
        ) : null
    )
});

export const SubTitle = styled.p`
    font-weight: 600;
    line-height: 12px;
    padding: 0 0;
    margin: 0;
    white-space: nowrap;
    
    ${props => {
        switch (props.align) {
            case 'center':
                return 'text-align: center;'
            case 'right':
                return 'text-align: right;'
            default:
                return 'text-align: left;'
        }

    }
    }
`
export const P = styled.p`
   
    margin: 0;
    padding: 0.2em 0;
    text-transform: uppercase;
    ${props => {
        switch (props.align) {
            case 'center':
                return 'text-align: center;'
            case 'right':
                return 'text-align: right;'
            default:
                return 'text-align: left;'
        }
    }}
   
`
export const Line = styled.div`
    border: none;
    border-top: 1px dashed black;
`
const Space = styled.div`
 margin-bottom: 0.6em;
 ${props => {
        switch (props.size) {
            case 'small':
                return 'margin-bottom: 0.2em;'
            case 'medium':
                return 'margin-bottom: 0.8em;'
            case 'large':
                return 'margin-bottom: 1.6em;'
            default:
                return 'margin-bottom: 0.8em;'
        }
    }}

`