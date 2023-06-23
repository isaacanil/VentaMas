import React from 'react'
import { ConfirmationDialog } from './components/ConfirmationDialog/ConfirmationDialog'
import { useSelector } from 'react-redux';
import { selectCurrentUserNotification } from '../../../../features/UserNotification/UserNotificationSlice';

export const NotificationHandler = ({ type,    }) => {

    const confirmation = useSelector(selectCurrentUserNotification);
    const {isOpen, title, description} = confirmation;

    switch (type) {
        case 'confirmation':
            return <ConfirmationDialog 
                isOpen={isOpen}
                title={title}
                description={description}
                
            />
        case 'alert':
            return null
        case 'notification':
            return null
        default:
            return null
    }
}
