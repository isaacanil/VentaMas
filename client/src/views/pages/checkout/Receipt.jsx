import React, { Fragment } from 'react'

import style from './ReceiptStyle.module.scss'
import { separator } from '../../../hooks/separator'
import styled from 'styled-components'
import { ProductList } from './components/ProductList'
import { PaymentArea } from './components/PaymentArea'
import { Row } from './components/Table/Row'
import { Col } from './components/Table/Col'

let today = new Date()
let [month, day, year] = [today.getMonth() + 1, today.getDate(), today.getFullYear()]
let [hour, minute, second] = [today.getHours(), today.getMinutes(), today.getSeconds()]

export const Receipt = React.forwardRef(({ data }, ref) => {
    //const {paymentMethod} = data

    //console.log(paymentMethodActivated)

    return (data ? (
        <div className={style.Container} ref={ref}>
            <h3 className={style.center} style={{ margin: 0, fontSize: '18px' }}>Hi Pizza</h3>
            <h4 className={style.center}>Plaza Ana Rocio 1er nivel</h4>
            <h4 className={style.center}>809-761-9082</h4>
            <br />
            <div className={style.timeSection}>
                <p>{`${day}/${month}/${year}`}</p>
                <p>{`${hour}:${minute}:${second}`}</p>
            </div>
            <div>
                <p>NCF: {data.NCF}</p>
            </div>
            {
                data.client ? (
                    <Fragment>
                        <p>Cliente: <span className={style.capital}>{data.client.name ? data.client.name : 'Cliente Genérico'}</span></p>
                        {
                            data.client.tel ? <p>Teléfono : {data.client.tel}</p> : null
                        }
                        {
                            data.client.personalID ? <p>Cédula/RNC : {data.client.personalID}</p> : null
                        }
                        {
                            data.client.address ? <p>Dir : {data.client.address}</p> : null
                        }
                    </Fragment>
                ) : null
            }
            <hr className={style.line} />
            <Col>
                <Title> FACTURA PARA CONSUMIDOR FINAL</Title>
            </Col>
            <hr className={style.line} />
            <Row cols='3'>
                <div className={style.left}>DESCRIPCION</div>
                <div className={style.right}>ITBIS</div>
                <div className={style.right}>VALOR</div>
            </Row>
            <hr className={style.line} />
            <ProductList data={data} />
            <hr className={style.line} />
            <PaymentArea data={data} />
        </div>
    ) : null)
});


export const Title = styled.h4`
    font-size: 14px;
`