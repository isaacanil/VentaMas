import React, { Fragment } from 'react'

import style from './ReceiptStyle.module.scss'
import { separator } from '../../../hooks/separator'
import styled from 'styled-components'
import { ProductList } from './components/ProductList'
import { PaymentArea } from './components/PaymentArea'
import { Row } from './components/Table/Row'
import { Col } from './components/Table/Col'
import { DateTime } from 'luxon'
import { useFormatPhoneNumber } from '../../../hooks/useFormatPhoneNumber'

let today = new Date()
let [month, day, year] = [today.getMonth() + 1, today.getDate(), today.getFullYear()]
let [hour, minute, second] = [today.getHours(), today.getMinutes(), today.getSeconds()]
const fechaActual = DateTime.now().toFormat('dd/MM/yyyy HH:mm');
export const Receipt = React.forwardRef(({ data }, ref) => {

    return (
        data ? (
            <div className={style.Container} ref={ref}>
                <Title>Hi Pizza</Title>
                <P align="center">Plaza Ana Rocio 1er nivel</P>
                <P align="center">809-761-9082</P>
                <P>{fechaActual}</P>
                <P>NCF: {data.NCF}</P>
                {
                    data.client ? (
                        <Fragment>
                            <P>CLIENTE: <span className={style.capital}>{data.client.name ? data.client.name : 'CLIENTE GENERICO'}</span></P>
                            {
                                data.client.tel ? <P>TEL: {useFormatPhoneNumber(data.client.tel)}</P> : null
                            }
                            {
                                data.client.personalID ? <P>CEDULA/RNC: {data.client.personalID}</P> : null
                            }
                            {
                                data.client.address ? <P>DIR: {data.client.address}</P> : null
                            }
                        </Fragment>
                    ) : null
                }
                <Line/>
                <Row space>
                <SubTitle> FACTURA PARA CONSUMIDOR FINAL</SubTitle>

                </Row>

                <Line/>
                <Row cols='3' space>
                    <P>DESCRIPCION</P>
                    <P align="right">ITBIS</P>
                    <P align="right">VALOR</P>
                </Row>
                <Line/>
                <ProductList data={data} />
                <hr className={style.line} />
                <PaymentArea data={data} />
            </div>
        ) : null
    )
});


export const Title = styled.p`
    font-size: 18px;
    font-weight: 600;
    padding: 0.2em 0;
    text-align: center;
    margin: 0;
`
export const SubTitle = styled.p`
    font-size: 13px;
    font-weight: 500;
    padding: 0.2em 0;
    margin: 0;
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