
import * as antd from 'antd'
import React, { Fragment } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { icons } from '../../../../../constants/icons/icons'
import { OPERATION_MODES } from '../../../../../constants/modes'
import { useDialog } from '../../../../../Context/Dialog'
import { getOrderData as getOrderDataToOrder } from '../../../../../features/addOrder/addOrderSlice'
import { selectUser } from '../../../../../features/auth/userSlice'
import { addNotification } from '../../../../../features/notification/notificationSlice'
import { getOrderData } from '../../../../../features/purchase/addPurchaseSlice'
import { fbDeleteOrder } from '../../../../../firebase/order/fbDeleteOrder'
import { ButtonGroup } from '../../../../templates/system/Button/ButtonGroup'

export const ActionsButtonsGroup = ({ orderData }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectUser)

    const { dialog, setDialogConfirm, onClose } = useDialog();

    const handleEditMode = () => {
        navigate(`/orders/update/`)
        dispatch(getOrderDataToOrder({ data: orderData, mode: OPERATION_MODES.UPDATE.id }))
    }
    const handlePurchasingMode = async () => {
        dispatch(getOrderData(orderData));
        navigate('/purchases/create');
    }
    const handleDeleteMode = () => {
        setDialogConfirm({
            ...dialog,
            isOpen: true,
            title: 'Eliminar orden',
            type: 'error',
            message: '¿Está seguro que desea eliminar esta orden?',
            onCancel: () => onClose(),
            onConfirm: () => {
                fbDeleteOrder(user, orderData.id)
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
                    <antd.Button
                        icon={icons.operationModes.buy}
                        onClick={handlePurchasingMode}
                    />
                }

                <antd.Button
                    icon={icons.operationModes.edit}
                    onClick={handleEditMode}
                />
                {
                    orderData.state === 'state_2' &&
                    <antd.Button
                        danger
                        icon={icons.operationModes.delete}
                        onClick={handleDeleteMode}
                    />
                }
            </Fragment>
        </ButtonGroup>
    )
}
