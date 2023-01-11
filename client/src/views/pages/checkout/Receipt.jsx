import React, { Fragment } from 'react'

import style from './ReceiptStyle.module.scss'
import { separator } from '../../../hooks/separator'
import styled from 'styled-components'

let today = new Date()
let [month, day, year] = [today.getMonth() + 1, today.getDate(), today.getFullYear()]
let [hour, minute, second] = [today.getHours(), today.getMinutes(), today.getSeconds()]

export const Receipt = React.forwardRef(({ data }, ref) => {
    //const {paymentMethod} = data
    const paymentMethodActivated = data.paymentMethod.find((payment) => payment.status === true)
    //console.log(paymentMethodActivated)
    const paymentMethodLabel = (value) => {
        switch (value) {
            case 'cash':
                return 'EFECTIVO'
            case 'card':
                return 'TARJETA'
            case 'transfer':
                return 'TRANSFERENCIA'
            default:
                break;
        }
    }
    return (data ? (
        <div className={style.Container} ref={ref}>
            <h3 className={style.center} style={{ margin: 0, fontSize: '18px' }}>Hi Pizza</h3>
            <h4 className={style.center}>Plaza Ana Rocio 1er nivel</h4>
            <h4 className={style.center}>809-761-9082</h4>
            <div className={style.timeSection}>
                <h4>{`${day}/${month}/${year}`}</h4>
                <h4>{`${hour}:${minute}:${second}`}</h4>
            </div>
            <div>
                <h4>NCF: {data.NCF}</h4>
            </div>
            {
                data.client ? (
                    <Fragment>
                        <h4>Cliente: <span className={style.capital}>{data.client.name ? data.client.name : 'Cliente Genérico'}</span></h4>
                        {
                            data.client.tel ? <h4>Teléfono : {data.client.tel}</h4> : null
                        }
                        {
                            data.client.address ? <h4>Dir : {data.client.address}</h4> : null
                        }
                    </Fragment>
                ) : null
            }
            
            <hr className={style.line} />
            <h4 className={style.center}>FACTURA PARA CONSUMIDOR FINAL</h4>
            <hr className={style.line} />
            <div>
                <Row>
                    <div className={style.left}>DESCRIPCION</div>
                    <div className={style.right}>ITBIS</div>
                    <div className={style.right}>VALOR</div>
                </Row>
                <hr className={style.line} />
                <div className={style.product_list}>
                    {
                        data.products.length > 0 ? (
                            data.products.map((product, index) => (
                                <Fragment key={index}>
                                    <li className={style.product} key={index}>
                                        <div className={style.row3}>
                                            <div>{product.amountToBuy.total} x {separator(product.price.unit)}</div>
                                            <div className={style.right}>{separator(product.tax.total)}</div>
                                            <div className={style.right}>{separator(product.price.total)}</div>
                                        </div>
                                        <div className={style.row1}>
                                            <div className={`${style.productName}`}>{product.productName}</div>
                                        </div>
                                    </li>
                                </Fragment>
                            ))
                        ) : null
                    }
                </div>
                <hr className={style.line} />

                {
                    data.delivery.status ? (
                        <Row>
                            <div className={style.title}>ENVIO :</div>
                            <div></div>
                            <div className={style.right}>{separator(data.delivery.value)}</div>
                        </Row>
                    ) : null
                }
                {/* <Row>
                    <div className={style.title}>TOTAL ITBIS</div>
                    <div className={style.right}></div>
                    <div className={style.right}>{separator(data.totalTaxes.value)}</div>
                </Row> */}
                <Row>
                    <div className={style.title}>TOTAL A PAGAR</div>
                    <div className={style.right}>{separator(data.totalTaxes.value)}</div>
                    <div className={style.right}>{separator(data.totalPurchase.value)}</div>
                </Row>
                {

                    <Row>
                        <div className={style.title}>{paymentMethodLabel(paymentMethodActivated.method)}</div>
                        <div></div>
                        <div className={style.right}>{separator(paymentMethodActivated.value)}</div>
                    </Row>


                }
                <Row>
                    <div className={style.title}>CAMBIO</div>
                    <div></div>
                    <div className={style.right}>{separator(data.change.value)}</div>
                </Row>
            </div>
        </div>
    ) : null)
});

const Row = styled.div`
display: grid;
grid-template-columns: 1fr 0.8fr 0.8fr;
/* ${(props) => {
        switch (props.border) {
            case 'bottom-dashed':
                return `
            border-bottom: 1px dashed rgba(0, 0, 0, 0.200);

            `
                break;

            default:
                break;
        }
    }} */
`
