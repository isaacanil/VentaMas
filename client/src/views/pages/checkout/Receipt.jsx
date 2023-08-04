import React, { Fragment } from 'react'

import style from './ReceiptStyle.module.scss'
import styled from 'styled-components'
import { ProductList } from './components/ProductList'
import { PaymentArea } from './components/PaymentArea'
import { Row } from './components/Table/Row'
import { Col } from './components/Table/Col'
import { DateTime } from 'luxon'
import { useFormatPhoneNumber } from '../../../hooks/useFormatPhoneNumber'
import { useSelector } from 'react-redux'
import { selectBusinessData } from '../../../features/auth/businessSlice'
import { Header } from './components/Header/Header'


export const Receipt = React.forwardRef(({ data }, ref) => {
    let business = useSelector(selectBusinessData)

    console.log(data)
    return (
        business && data ? (
            <Container ref={ref}>
                <Header
                    data={data}
                    business={business}
                    Space={Space}
                    SubTitle={SubTitle}
                    P={P}
                />
                <Space  />
                <Line />
                <Row space>
                    <SubTitle align='center'> FACTURA PARA CONSUMIDOR FINAL</SubTitle>
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
            </Container>
        ) : null
    )
});

const Container = styled.div`
    * {
        margin: 0;
    }

    line-height: 24px;
    
    width: 100%;
//cuanto seria el maximo de ancho de la factura 80mm = 226.772px
    font-size: 14px;
    text-transform: uppercase;
    font-family:'Lato', sans-serif;
    position: absolute;
    pointer-events: none;
    z-index: -100000000;
    p {
        line-height: 16px;
    }
    `

export const SubTitle = styled.p`
    font-size: 13px;
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
    font-size: 13px;
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