import React from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { ButtonIconMenu } from '../../../system/Button/ButtonIconMenu';
import { icons } from '../../../../../constants/icons/icons';
import { openNotificationCenter } from '../../../../../features/notification/notificationCenterSlice';

export const NotificationButton = ({ handleCloseMenu = () => {} }) => {
    const dispatch = useDispatch();
    const handleOpenNotifications = () => {
        dispatch(openNotificationCenter('taxReceipt'));
        handleCloseMenu?.();
    }

    return (
        <ButtonIconMenu
            onClick={handleOpenNotifications}
            icon={icons.system.notification}
        />
    )
}








