
import React, { Fragment, useEffect, useState } from 'react'
import { IoCartSharp, IoTrashSharp } from 'react-icons/io5'
import { MdOutlineCheck, MdOutlineClear, MdOutlineDelete } from 'react-icons/md'
import { TbEdit } from 'react-icons/tb'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { toggleAddPurchaseModal } from '../../../../../features/modals/modalSlice'
import { getOrderData } from '../../../../../features/Purchase/addPurchaseSlice'
import { deleteOrderFromDB, PassDataToPurchaseList } from '../../../../../firebase/firebaseconfig'
import { Button } from '../../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../../templates/system/Button/ButtonGroup'
import { getOrderData as getOrderDataToOrder} from '../../../../../features/addOrder/addOrderModalSlice'
import { Tooltip } from '../../../../templates/system/Button/Tooltip'
import { faPencil } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '../../../../../constants/icons/icons'
import { setUserNotification } from '../../../../../features/UserNotification/UserNotificationSlice'
import { useDialog } from '../../../../../Context/Dialog/DialogContext'
import { selectUser } from '../../../../../features/auth/userSlice'
import { OPERATION_MODES } from '../../../../../constants/modes'

export const ActionsButtonsGroup = ({ orderData }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectUser)
    
    const { dialog, setDialogConfirm, onClose } = useDialog();

    const handleEditMode = (id) => {
       navigate(`/orders-create/`)
       dispatch( getOrderDataToOrder({data: orderData, mode: OPERATION_MODES.UPDATE.id}))
    }
    const handlePurchasingMode = async (id) => {
        // PassDataToPurchaseList(orderData)
        dispatch(getOrderData( orderData));
        navigate('/purchases-create');
    }
    const handleDeleteMode = (id) => {
        // deleteOrderFromDB(orderData.id)
        console.log('eliminación completada');
        setDialogConfirm({
            ...dialog,
            isOpen: true,
            title: 'Eliminar orden',
            type: 'error',
            message: '¿Está seguro que desea eliminar esta orden?',
            onCancel: () => onClose()
        })
    }

    return (
        <ButtonGroup >
            <Fragment>
                <Button
                    borderRadius='normal'
                    title={icons.operationModes.buy}
                    width='icon32'
                    color='gray-dark'
                    onClick={() => handlePurchasingMode(orderData.id)}
                />
                <Button
                    borderRadius='normal'
                    title={icons.operationModes.edit}
                    width='icon32'
                    color='gray-dark'
                    onClick={() => handleEditMode(orderData.id)}
                />
                <Button
                    borderRadius='normal'
                    title={icons.operationModes.delete}
                    width='icon32'
                    color='gray-dark'
                    onClick={() => handleDeleteMode(orderData.id)}
                />
            </Fragment>
        </ButtonGroup>
    )
}
