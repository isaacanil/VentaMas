
import React, { Fragment, useEffect, useState } from 'react'
import { IoCartSharp, IoTrashSharp } from 'react-icons/io5'
import { MdOutlineCheck, MdOutlineClear, MdOutlineDelete } from 'react-icons/md'
import { TbEdit } from 'react-icons/tb'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toggleAddPurchaseModal } from '../../../../features/modals/modalSlice'
import { selectOrderList, selectPendingOrder, } from '../../../../features/order/ordersSlice'
import { getOrderData } from '../../../../features/Purchase/addPurchaseSlice'
import { deleteOrderFromDB, deletePurchase, PassDataToPurchaseList } from '../../../../firebase/firebaseconfig'
import { Button } from '../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../templates/system/Button/ButtonGroup'
import { Tooltip } from '../../../templates/system/Button/Tooltip'

export const ActionsButtonsGroup = ({ purchaseData, activeId, setActiveId }) => {
    const modes = {
        purchase: 'purchase',
        delete: 'delete',
        edit: 'edit'
    }
    const dispatch = useDispatch()
    const [showConfirmButtons, setShowConfirmButtons] = useState(false)
    const [isAccept, setIsAccept] = useState(null)
    const [mode, setMode] = useState(null)
    const navigate = useNavigate()
    useEffect(() => {
        if (!activeId || purchaseData.id !== activeId) {
            setShowConfirmButtons(false)
        }
        if (activeId && purchaseData.id === activeId && mode !== null) {
            setShowConfirmButtons(true)
        }
    }, [activeId, purchaseData.id])
    const handleEditMode = (id) => {
        setMode(modes.edit)
        setActiveId(id)
        setShowConfirmButtons(true)
    }

    const handleDeleteMode = (id) => {
        setMode(modes.delete)
        setActiveId(id)
        setShowConfirmButtons(true)
    }
    const confirmationHandlers = {
        edit: {
            accept: () => {
                console.log('editar aceptada')
                setShowConfirmButtons(false)
                setMode(null)
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
                deletePurchase(purchaseData.id)
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
        setMode(null)
        setIsAccept(null) // reset the state variable
    }
    useEffect(() => {
        switch (mode) {
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
                    <Tooltip
                        description='Editar'
                        placement='bottom-start'
                        Children={
                            <Button
                                borderRadius='normal'
                                title={<TbEdit />}
                                width='icon32'
                                color='gray-dark'
                                onClick={() => handleEditMode(purchaseData.id)}
                            />
                        }
                    />
                    <Tooltip
                        description='Eliminar'
                        placement='bottom'
                        Children={
                            <Button
                                borderRadius='normal'
                                title={<IoTrashSharp />}
                                width='icon32'
                                bgcolor='error'
                                onClick={() => handleDeleteMode(purchaseData.id)}
                            />
                        }
                    />
                   
                </Fragment>
            ) : (
                <Fragment>
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
                </Fragment>
            )}
        </ButtonGroup>
    )
}
