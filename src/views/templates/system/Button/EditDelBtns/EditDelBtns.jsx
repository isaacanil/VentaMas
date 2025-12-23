import { Button } from 'antd';
import { useDispatch } from 'react-redux';

import { icons } from '@/constants/icons/icons';
import { useDialog } from '@/Context/Dialog';
import { addNotification } from '@/features/notification/notificationSlice';
import { ButtonGroup } from '@/views/templates/system/Button/Button';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const EditDelBtns = ({ onUpdate, onDelete = async () => {} }) => {
  const dispatch = useDispatch();
  const { dialog, setDialogConfirm, onClose } = useDialog();

  const deleteConfirm = async () => {
    setDialogConfirm({
      ...dialog,
      isOpen: true,
      title: 'Confirmación de Eliminación',
      type: 'error',
      message: '¿Está seguro que desea eliminar este elemento?',
      onCancel: () => onClose(),
      onConfirm: async () => {
        await onDelete().then(() => {
          onClose();
          dispatch(
            addNotification({
              type: 'success',
              title: 'Elemento Eliminado',
              message: 'El elemento ha sido eliminado con éxito.',
            }),
          );
        });
      },
    });
  };

  return (
    <ButtonGroup>
      <Button icon={icons.operationModes.edit} onClick={onUpdate} />
      <Button
        icon={icons.operationModes.delete}
        onClick={deleteConfirm}
        danger
      />
    </ButtonGroup>
  );
};
