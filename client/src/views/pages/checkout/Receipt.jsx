import React, { Fragment } from 'react'

import style from './ReceiptStyle.module.scss'
import { separator } from '../../../hooks/separator'

let today = new Date()
let [month, day, year] = [today.getMonth() + 1, today.getDate(), today.getFullYear()]
let [hour, minute, second] = [today.getHours(), today.getMinutes(), today.getSeconds()]
export const Receipt = React.forwardRef(({ data }, ref) => (



    <div className={style.Container} ref={ref}>
        <h3 style={{ margin: 0, }} className={style.center}>Hi Pizza</h3>
        <h5>Tel 809-761-9082</h5>
        <h5>Dirección : Plaza Ana Rocio 1er nivel</h5>
        <div className={style.timeSection}>
            <h5>{`${day}/${month}/${year}`}</h5>
            <h5>{`${hour}:${minute}:${second}`}</h5>
        </div>
        <hr />
        <h5 className={style.center}>FACTURA PARA CONSUMIDOR FINAL</h5>
        <hr />
        <table>
            <thead>

                <td className={style.left}>DESCRIPCION</td>
                <td className={style.right}>ITBIS</td>
                <td className={style.right}>VALOR</td>
            </thead>
            <hr />
            <tbody >

                {
                    data.products.length > 0 ? (
                        data.products.map((product, index) => (
                            <Fragment key={index}>
                                <tr key={index}>
                                    <td>{product.amountToBuy.total} x {separator(product.price.unit)}</td>
                                </tr>
                                <tr key={index}>
                                    <td className={`${style.productName}`}>{product.productName}</td>
                                    <td className={style.right}>{separator(product.tax.total)}</td>
                                    <td className={style.right}>{separator(product.price.total)}</td>

                                </tr>
                            </Fragment>
                        ))
                    ) : null
                }
                <br />
                {
                    data.delivery.status ? (
                        <tr>
                            <td className={style.title}>ENVIO :</td>
                            <td></td>
                            <td className={style.right}>{separator(data.delivery.value)}</td>
                        </tr>
                    ) : null
                }

                <br />
                <hr />
                <tr>
                    <td className={style.title}>TOTAL ITBIS</td>
                    <td className={style.right}></td>
                    <td className={style.right}>{separator(data.totalTaxes.value)}</td>
                </tr>
                <tr>
                    <td className={style.title}>TOTAL A PAGAR</td>
                    <td className={style.right}>{separator(data.totalTaxes.value)}</td>
                    <td className={style.right}>{separator(data.totalPurchase.value)}</td>
                </tr>
                {
                    data.cashPaymentMethod.status ? (
                        <Fragment>
                            <tr>
                                <td className={style.title}>EFECTIVO</td>
                                <td></td>
                                <td className={style.right}>{separator(data.cashPaymentMethod.value)}</td>
                            </tr>

                        </Fragment>

                    ) : null
                }
                {
                    data.cardPaymentMethod.status ? (
                        <Fragment>
                            <tr>
                                <td className={style.title}>TARJETA</td>
                                <td></td>
                                <td className={style.right}>{separator(data.cardPaymentMethod.value)}</td>
                            </tr>
                        </Fragment>

                    ) : null
                }
                {
                    data.transferPaymentMethod.status ? (
                        <Fragment>
                            <tr>
                                <td className={style.title}>TRANSFERENCIA</td>
                                <td></td>
                                <td className={style.right}>{separator(data.transferPaymentMethod.value)}</td>
                            </tr>
                        </Fragment>

                    ) : null
                }
                {
                    data.cashPaymentMethod.status || data.cardPaymentMethod.status || data.transferPaymentMethod.status ? (
                        <Fragment>
                            <tr>
                                <td className={style.title}>CAMBIO</td>
                                <td></td>
                                <td className={style.right}>{separator(data.change.value)}</td>
                            </tr>
                        </Fragment>

                    ) : null
                }
                
               

            </tbody>
        </table>
    </div>
));


