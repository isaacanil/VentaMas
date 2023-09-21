import { useDispatch } from "react-redux";
import { useDialog } from "../../../../../Context/Dialog/DialogContext";
import { icons } from "../../../../../constants/icons/icons";
import { Button, ButtonGroup } from "../Button"

export const EditDelBtns = ({ onUpdate, onDelete = async () => { } }) => {

    const { dialog, setDialogConfirm, onClose } = useDialog();
    const dispatch = useDispatch();
    const deleteConfirm = async () => {
        setDialogConfirm({
            ...dialog,
            isOpen: true,
            title: 'Confirmación de Eliminación',
            type: 'error',
            message: '¿Está seguro que desea eliminar este elemento?',
            onCancel: () => onClose(),
            onConfirm: async () => {
                await onDelete()
                    .then(() => {
                        onClose();
                        dispatch(addNotification({
                            type: 'success',
                            title: 'Elemento Eliminado',
                            message: 'El elemento ha sido eliminado con éxito.'
                        }))
                    })
            }
        })
    }
    return (
        <ButtonGroup >
            <Button
                borderRadius='normal'
                title={icons.operationModes.edit}
                width='icon32'
                color='gray-dark'
                onClick={onUpdate}
            />
            <Button
                borderRadius='normal'
                title={icons.operationModes.delete}
                width='icon32'
                color='gray-dark'
                onClick={deleteConfirm}
            />
        </ButtonGroup>
    )
}