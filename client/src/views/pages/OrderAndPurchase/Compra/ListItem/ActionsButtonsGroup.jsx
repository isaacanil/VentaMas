import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setAddPurchaseMode, setPurchase } from '../../../../../features/purchase/addPurchaseSlice'
import { ButtonGroup } from '../../../../templates/system/Button/ButtonGroup'
import { icons } from '../../../../../constants/icons/icons'
import { useDialog } from '../../../../../Context/Dialog/DialogContext'
import ROUTES_PATH from '../../../../../routes/routesName'
import {Button} from 'antd'

export const ActionsButtonsGroup = ({ purchaseData }) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const {PURCHASES_CREATE} = ROUTES_PATH.PURCHASE_TERM
    const {dialog, setDialogConfirm} = useDialog()
  
    const handleEditMode = () => {
        navigate(PURCHASES_CREATE);
        dispatch(setAddPurchaseMode('edit'))
        dispatch(setPurchase(purchaseData.value))
    }

    const handleDeleteMode = (id) => {
        setDialogConfirm({
            isOpen: true,
            title: 'Eliminar Orden',
            type: 'warning',
            message: '¿Está seguro que desea eliminar esta orden?',
            onConfirm: () => console.log('confirm'),
           
        })
    }
 
    return (
        <ButtonGroup>
            <Button
                icon={icons.operationModes.edit}
                color='error'
              //  disabled={!isEditable}
                onClick={() => handleEditMode(purchaseData.id)}
            />
           
            <Button
                danger
                icon={icons.operationModes.delete}
                onClick={() => handleDeleteMode(purchaseData.id)}
            />
        </ButtonGroup>
    )
}
