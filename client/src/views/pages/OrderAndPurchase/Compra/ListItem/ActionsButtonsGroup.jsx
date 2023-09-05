
import React, { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toggleAddPurchaseModal } from '../../../../../features/modals/modalSlice'
import { getOrderData } from '../../../../../features/Purchase/addPurchaseSlice'
import { deleteOrderFromDB, deletePurchase, PassDataToPurchaseList } from '../../../../../firebase/firebaseconfig'
import { Button } from '../../../../templates/system/Button/Button'
import { ButtonGroup } from '../../../../templates/system/Button/ButtonGroup'

import { icons } from '../../../../../constants/icons/icons'
import { useDialog } from '../../../../../Context/Dialog/DialogContext'

export const ActionsButtonsGroup = ({ purchaseData }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
   
    const {dialog, setDialogConfirm} = useDialog()
  
    const handleEditMode = (id) => {
        setMode(modes.edit)
    }

    const handleDeleteMode = (id) => {
        setMode(modes.delete)
        setDialogConfirm({
            isOpen: true,
            title: 'Eliminar Orden',
            type: 'warning',
            message: '¿Está seguro que desea eliminar esta orden?',
            onConfirm: () => console.log('confirm'),
            onCancel: () => console.log('cancel')
        })
    }
 
    return (
        <ButtonGroup>
            <Button
                borderRadius='normal'
                title={icons.operationModes.edit}
                width='icon32'
                color='gray-dark'
                onClick={() => handleEditMode(purchaseData.id)}
            />
            <Button
                borderRadius='normal'
                title={icons.operationModes.delete}
                width='icon32'
                color='gray-dark'
                onClick={() => handleDeleteMode(purchaseData.id)}
            />
        </ButtonGroup>
    )
}
