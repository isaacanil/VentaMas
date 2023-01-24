
import React, { Fragment, useEffect, useState } from 'react'
import { IoCartSharp, IoTrashSharp } from 'react-icons/io5'
import { MdOutlineCheck, MdOutlineClear, MdOutlineDelete } from 'react-icons/md'
import { TbEdit } from 'react-icons/tb'
import { useDispatch, useSelector } from 'react-redux'
import { selectOrderList, selectPendingOrder } from '../../../../features/order/ordersSlice'
import { deleteOrderFromDB } from '../../../../firebase/firebaseconfig'
import { Button } from '../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../templates/system/Button/ButtonGroup'

export const ActionsButtonsGroup = ({ orderData }) => {
    const modes = {
        purchase: 'purchase',
        delete: 'delete',
        edit: 'edit'
    }
    const dispatch = useDispatch()
    const OrderListRef = useSelector(selectOrderList)
    const [showConfirmButtons, setShowConfirmButtons] = useState(false)
    const [isAccept, setIsAccept] = useState(null)
    const [mode, setMode] = useState()
    useEffect(() => {
        if (orderData.data.id && !orderData.selected) {
            setShowConfirmButtons(false)
        }
    }, [orderData])
    useEffect(() => {
        if (orderData.data.id && orderData.selected) {
            setShowConfirmButtons(true)
        } else {
            setShowConfirmButtons(false)
        }
    }, [OrderListRef])
    const handleEditMode = () => {
        setMode(modes.edit)

        dispatch(selectPendingOrder({ id: orderData.data.id }))

    }
    const handleDeleteMode = () => {
        setMode(modes.delete)
        dispatch(selectPendingOrder({ id: orderData.data.id }))
    }
    const handlePurchasingMode = async () => {
        setMode(modes.purchase)
        dispatch(selectPendingOrder({ id: orderData.data.id }))

    }
    const confirmationHandlers = {
        purchase: {
            accept: () => {
                console.log('compra aceptada')
                setShowConfirmButtons(false)
                setIsAccept(null) // reset the state variable
            },
            reject: () => {
                console.log('compra rechazada')
                setShowConfirmButtons(false)
                setIsAccept(null) // reset the state variable
            }
        },
        edit: {
            accept: () => {
                console.log('editar aceptada')
                setShowConfirmButtons(false)
                setIsAccept(null) // reset the state variable
            },
            reject: () => {
                console.log('editar rechazada')
                setShowConfirmButtons(false)
                setIsAccept(null) // reset the state variable
            }
        },
        delete: {
            accept: () => {
                deleteOrderFromDB(orderData.data.id)
                console.log('eliminación completada')
                setShowConfirmButtons(false)
                setIsAccept(null) // reset the state variable
            },
            reject: () => {
                console.log('eliminación rechazada')
                setShowConfirmButtons(false)
                setIsAccept(null) // reset the state variable
            }
        },

    }
    const reset = () => {
        setShowConfirmButtons(false)
        setIsAccept(null) // reset the state variable
    }
    useEffect(() => {
        switch (mode) {
            case modes.purchase:
                if (isAccept === true) {
                    confirmationHandlers.purchase.accept()
                    return
                }
                if (isAccept === false) {
                    confirmationHandlers.purchase.reject()
                    return
                }
                if (isAccept === null) {
                    reset()
                    return
                }
            case modes.edit:
                if (isAccept === true) {
                    confirmationHandlers.edit.accept()
                    return
                } else if (isAccept === false) {
                    confirmationHandlers.edit.reject()
                    return
                } else if (isAccept === null) {
                    reset()
                    return
                }
            case modes.delete:
                if (isAccept === true) {
                    confirmationHandlers.delete.accept()
                    return
                } else if (isAccept === false) {
                    confirmationHandlers.delete.reject()
                    return
                } else if (isAccept === null) {
                    reset()
                    return
                }
        }
    }, [isAccept])

    return (
        <ButtonGroup position={showConfirmButtons === true ? 'right' : null}>
            {showConfirmButtons === false ? (
                <Fragment>
                    <Button
                        borderRadius='normal'
                        title={<IoCartSharp />}
                        width='icon32'
                        color='gray-dark'
                        onClick={handlePurchasingMode}
                    />
                    <Button
                        borderRadius='normal'
                        title={<TbEdit />}
                        width='icon32'
                        color='gray-dark'
                        onClick={handleEditMode}
                    />
                    <Button
                        borderRadius='normal'
                        title={<IoTrashSharp />}
                        width='icon32'
                        bgcolor='error'
                        onClick={handleDeleteMode}
                    />
                </Fragment>

            ) : null}

            {showConfirmButtons === true ? (
                <>
                    <Button
                        borderRadius='normal'
                        title={<MdOutlineCheck />}
                        width='icon32'
                        bgcolor='success'
                        onClick={() => setIsAccept(true)}
                    />
                    <Button
                        borderRadius='normal'
                        title={<MdOutlineClear />}
                        width='icon32'
                        onClick={() => setIsAccept(false)}
                    />
                </>
            ) : null}
        </ButtonGroup>
    )
}
