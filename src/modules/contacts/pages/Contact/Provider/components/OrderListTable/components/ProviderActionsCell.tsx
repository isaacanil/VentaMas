import { Button, Popconfirm, message } from 'antd';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes';
import { selectUser } from '@/features/auth/userSlice';
import { toggleProviderModal } from '@/features/modals/modalSlice';
import { fbDeleteProvider } from '@/firebase/provider/fbDeleteProvider';
import { ButtonGroup } from '@/components/ui/Button/Button';

import type { ProviderTableRow } from '../types';

const UPDATE_MODE = OPERATION_MODES.UPDATE.id;

interface ProviderActionsCellProps {
  provider: ProviderTableRow;
}

export const ProviderActionsCell = ({
  provider,
}: ProviderActionsCellProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditProvider = () => {
    if (!provider?.id) return;

    dispatch(
      toggleProviderModal({
        mode: UPDATE_MODE,
        data: provider,
      }),
    );
  };

  const handleDeleteProvider = () => {
    if (!provider?.id || !user) return;

    setIsDeleting(true);

    void fbDeleteProvider(provider.id, user).then(
      () => {
        message.success('Proveedor eliminado correctamente');
        setIsDeleting(false);
      },
      (error) => {
        console.error('Error deleting provider:', error);
        message.error('No se pudo eliminar el proveedor');
        setIsDeleting(false);
      },
    );
  };

  return (
    <ButtonGroup>
      <Button
        icon={icons.operationModes.edit}
        onClick={handleEditProvider}
        disabled={!provider?.id}
        size="small"
      />
      <Popconfirm
        title="Eliminar proveedor"
        description={`¿Eliminar a ${provider?.name || 'este proveedor'}?`}
        okText="Eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true, loading: isDeleting }}
        onConfirm={handleDeleteProvider}
        disabled={!provider?.id}
      >
        <Button
          danger
          icon={icons.operationModes.delete}
          loading={isDeleting}
          disabled={!provider?.id}
          size="small"
        />
      </Popconfirm>
    </ButtonGroup>
  );
};
