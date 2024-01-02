
import React, { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getOrderData } from '../../../../../features/purchase/addPurchaseSlice'
import { Button } from '../../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../../templates/system/Button/ButtonGroup'
import { getOrderData as getOrderDataToOrder } from '../../../../../features/addOrder/addOrderModalSlice'
import { icons } from '../../../../../constants/icons/icons'
import { useDialog } from '../../../../../Context/Dialog/DialogContext'
import { selectUser } from '../../../../../features/auth/userSlice'
import { OPERATION_MODES } from '../../../../../constants/modes'
import { fbDeleteOrder } from '../../../../../firebase/order/fbDeleteOrder'
import { addNotification } from '../../../../../features/notification/NotificationSlice'

export const ActionsButtonsGroup = ({ orderData }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectUser)

    const { dialog, setDialogConfirm, onClose } = useDialog();

    const handleEditMode = (id) => {
        navigate(`/orders-create/`)
        dispatch(getOrderDataToOrder({ data: orderData, mode: OPERATION_MODES.UPDATE.id }))
    }
    const handlePurchasingMode = async (id) => {
        // PassDataToPurchaseList(orderData)
        dispatch(getOrderData(orderData));
        navigate('/purchases-create');
    }
    const handleDeleteMode = (id) => {
        // deleteOrderFromDB(orderData.id)
        console.log(id);
        setDialogConfirm({
            ...dialog,
            isOpen: true,
            title: 'Eliminar orden',
            type: 'error',
            message: '¿Está seguro que desea eliminar esta orden?',
            onCancel: () => onClose(),
            onConfirm: () => {
                fbDeleteOrder(user, id)
                onClose()
                dispatch(addNotification({
                    type: 'success',
                    title: 'Orden eliminada',
                    message: 'La orden se ha eliminado correctamente'
                }))
            }
        })
    }

    return (
        <ButtonGroup >
            <Fragment>
                {

                    orderData.state === 'state_2' &&
                    <Button
                        borderRadius='normal'
                        title={icons.operationModes.buy}
                        size='icon32'
                        color='gray-dark'
                        onClick={() => handlePurchasingMode(orderData.id)}
                    />
                }

                <Button
                    borderRadius='normal'
                    title={icons.operationModes.edit}
                    size='icon32'
                    color='gray-dark'
                    onClick={() => handleEditMode(orderData.id)}
                />
                {
                    orderData.state === 'state_2' &&
                    <Button
                        borderRadius='normal'
                        title={icons.operationModes.delete}
                        size='icon32'
                        color='gray-dark'
                        onClick={() => handleDeleteMode(orderData.id)}
                    />
                }
            </Fragment>
        </ButtonGroup>
    )
}
