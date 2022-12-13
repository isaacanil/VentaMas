import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { separator } from '../../../../../hooks/separator'
import {
    setChange,
    addCashPaymentMethod,
    addCardPaymentMethod,
    addTransferPaymentMethod,
    totalTaxes,
    SelectClient,
    SelectTotalPurchaseWithoutTaxes,
    SelectTotalTaxes,
    SelectTotalPurchase,
    SelectChange
} from '../../../../../features/cart/cartSlice'

import {
    Grid,
    GridTitle,
    Row,
    InputNumber,
    InputText
} from '../Style'

export const PaymentMethod = () => {
    const dispatch = useDispatch()
    const TotalPurchaseWithoutTaxes = useSelector(SelectTotalPurchaseWithoutTaxes)
    const TotalTaxesRef = useSelector(SelectTotalTaxes)
    const TotalPurchaseRef = useSelector(SelectTotalPurchase)
    const ChangeRef = useSelector(SelectChange)
    const [cashPaymentMethod, setCashPaymentMethod] = useState({
        status: false,
        value: 0,

    })
    const cashValueRef = useRef(null)
    const cardValueRef = useRef(null)
    const transferValueRef = useRef(null)
    const [cardPaymentMethod, setCardPaymentMethod] = useState({
        status: false,
        value: 0
    })

    const [transferPaymentMethod, setTransferPaymentMethod] = useState({
        status: false,
        value: 0
    })
    useEffect(() => {
        dispatch(
            addCashPaymentMethod(cashPaymentMethod)
        )
        dispatch(
            addCardPaymentMethod(cardPaymentMethod)
        )
        dispatch(
            addTransferPaymentMethod(transferPaymentMethod)
        )
        dispatch(
            setChange()
        )
    }, [cashPaymentMethod, cardPaymentMethod, transferPaymentMethod])
    // useEffect(() => {
    //     if (cashPaymentMethod.status === true &&
    //         cardPaymentMethod.status === false &&
    //         transferPaymentMethod.status === false
    //     ) {
    //         setCashPaymentMethod({
    //             status: true,
    //             value: TotalPurchaseRef
    //         })
    //         setCardPaymentMethod({
    //             status: false,
    //             value: ""
    //         })
    //         setTransferPaymentMethod({
    //             status: false,
    //             value: ""
    //         })
    //     }
    //     if (cashPaymentMethod.status === false &&
    //         cardPaymentMethod.status === true &&
    //         transferPaymentMethod.status == false
    //     ) {
    //         setCardPaymentMethod({
    //             status: true,
    //             value: TotalPurchaseRef
    //         })
    //         setCashPaymentMethod({
    //             status: false,
    //             value: 0
    //         })
    //         setTransferPaymentMethod({
    //             status: false,
    //             value: 0
    //         })
    //     }
    //     if (cashPaymentMethod.status === false &&
    //         cardPaymentMethod.status === false &&
    //         transferPaymentMethod.status === true
    //     ) {
    //         setTransferPaymentMethod({
    //             status: true,
    //             value: TotalPurchaseRef
    //         })
    //         setCashPaymentMethod({
    //             status: false,
    //             value: ""
    //         })
    //         setCardPaymentMethod({
    //             status: false,
    //             value: ""
    //         })

    //     }

    //     dispatch(
    //         addCashPaymentMethod(cashPaymentMethod)
    //     )
    //     dispatch(
    //         addCardPaymentMethod(cardPaymentMethod)
    //     )
    //     dispatch(
    //         addTransferPaymentMethod(transferPaymentMethod)
    //     )
    //     dispatch(
    //         setChange()
    //     )

    // }, [])
    const handleCashPaymentMethod = (value) => {
        console.log(value)
        if (value) {
            setTimeout(() => {
                setCashPaymentMethod({
                    status: true,
                    value: TotalPurchaseRef
                })
            }, 30)
            setTimeout(() => {
                cashValueRef.current.select();
            }, 100)
        }
        if (value === false) {
            setTimeout(() => {
                setCashPaymentMethod({
                    status: false,
                    value: 0
                })
            }, 30)
            
        }

    }
    const handleCardPaymentMethod = (value) => {
        if (value && 
            cashPaymentMethod.status === false && 
            transferPaymentMethod.status === false 
            ) {
            setTimeout(() => {
                setCardPaymentMethod({
                    status: true,
                    value: TotalPurchaseRef
                })
            }, 30)
            setTimeout(() => {
                cardValueRef.current.select();
            }, 100)
        }
        if (value === false) {
            setTimeout(() => {
                setCardPaymentMethod({
                    status: false,
                    value: ''
                })
            }, 30)

        }
    }
    const handleTransferPaymentMethod = (value) => {
        if (value && 
            cashPaymentMethod.status === false &&
            cardPaymentMethod.status === false) {
            setTimeout(() => {
                setTransferPaymentMethod({
                    status: true,
                    value: TotalPurchaseRef
                })
            }, 30);
            setTimeout(() => {
                transferValueRef.current.select();
            }, 100)
        }
        if (value === false) {
            setTimeout(() => {
                setTransferPaymentMethod({
                    status: false,
                    value: ''
                })
            }, 30)
        }
    }

    console.log({ cashPaymentMethod, cardPaymentMethod, transferPaymentMethod })
    return (
        <Container>
            <Group display='grid'>
                <GridTitle>
                    <h4>Método de pago</h4>
                </GridTitle>
                <Row columns='payment'>
                    <input
                        name=""
                        id="cash"
                        type="checkbox"
                        onChange={(e) => setCashPaymentMethod({
                            ...cashPaymentMethod,
                            status: e.target.checked
                        })}
                        onClick={(e) => handleCashPaymentMethod(e.target.checked)}
                    />
                    <label htmlFor="cash">Efectivo</label>
                    <InputNumber
                        ref={cashValueRef}
                        value={cashPaymentMethod.status ? cashPaymentMethod.value : ''}
                        border='circle'
                        type="number"
                        placeholder='RD$'
                        onChange={e => {
                                (setCashPaymentMethod({
                                    ...cashPaymentMethod,
                                    value: e.target.value
                                }))
                        }} />
                </Row>
                <Row columns='payment'>
                    <input
                        type="checkbox"
                        name=""
                        id="card"
                        onChange={(e) => setCardPaymentMethod({
                            ...cardPaymentMethod,
                            status: e.target.checked
                        })}
                        onClick={(e) => handleCardPaymentMethod(e.target.checked)}
                    />
                    <label htmlFor="card">Tarjeta</label>
                    <InputNumber
                        ref={cardValueRef}
                        border='circle'
                        value={cardPaymentMethod.status ? cardPaymentMethod.value : ''}
                        type="number"
                        name="" id=""
                        placeholder='RD$'
                        onChange={e => {
                            e.target.value <= TotalPurchaseRef && 
                            ChangeRef < 0  ?
                                setCardPaymentMethod({
                                    ...cardPaymentMethod,
                                    value: e.target.value
                                })
                                : null
                        }}
                    />
                    {/* <InputText border='circle' type="text" name="" id="" placeholder='no. tarjeta' /> */}
                </Row>
                <Row columns='payment'>
                    <input
                        type="checkbox"
                        name=""
                        id="transfer"
                        onChange={(e) => setTransferPaymentMethod({
                            ...transferPaymentMethod,
                            status: e.target.checked
                        })}
                        onClick={(e) => handleTransferPaymentMethod(e.target.checked)}
                    />
                    <label htmlFor="transfer">Transferencia</label>
                    <InputNumber
                        ref={transferValueRef}
                        border='circle'
                        value={transferPaymentMethod.status ? transferPaymentMethod.value : ''}
                        type="number"
                        name=""
                        id=""
                        placeholder='RD$'
                        onChange={e => {
                            e.target.value <= TotalPurchaseRef && ChangeRef <= 0 ?
                            setTimeout(()=>{
                                setTransferPaymentMethod({
                                    ...transferPaymentMethod,
                                    value: e.target.value
                                })
                            }, 100)
                                : null
                        }} />
                    {/* <InputText border='circle' type="text" name="" id="" placeholder='no. transf' /> */}
                </Row>
            </Group>
            <Group display='flex'>
                <Row
                    columns='2'
                    bgColor='primary'
                    padding='normal'
                    borderRadius='normal'
                    fontWeight='title'
                >
                    <label>Total:</label>
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>RD$ {separator(TotalPurchaseRef)}</span>
                </Row>
                <Row
                    columns='2'
                    bgColor='black'
                    borderRadius='normal'
                    padding='normal'
                    fontWeight='title'
                    fontSize='title'
                >
                    <label>Cambio:</label>
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>RD$ {separator(ChangeRef)}</span>
                </Row>
            </Group>
        </Container>
    )
}

export const Container = styled.div`
     background-color: rgba(226, 225, 225, 0.671);
     padding: 0.6em 0.6em ;
     border-radius: 10px;
     display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr min-content;
     gap: 0.5em;

     
`
export const Group = styled.div`
    background-color: rgb(236, 236, 236);
    padding: 0.5em 0.5em;
    border-radius: 10px;
    
    
    ${(props) => {
        switch (props.display) {
            case 'flex':
                return `
                display: flex;
                justify-content: space-between;
                flex-direction: column;
                gap: 0.5em;
             
         
                `
            case 'grid':
                return `
                display: grid;
                align-items: start;
                align-content: start;
                gap: 0.8em;
           
                
                `
            default:
                break;
        }
    }}
    ${(props) => {
        switch (props.direction) {
            case 'column':
                return `
                display: flex;
                flex-direction: column;
               
                
                gap: 0.5em;
                `

            default:
                break;
        }
    }}
    ${(props) => {
        switch (props.gap) {
            case 'normal':
                return `
             
                gap: 0.5em;
                `
            default:
                break;
        }
    }}
   
`
