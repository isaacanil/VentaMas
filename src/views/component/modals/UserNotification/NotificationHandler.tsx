// @ts-nocheck
import React from 'react';
import { useSelector } from 'react-redux';

import { selectCurrentUserNotification } from '@/features/UserNotification/UserNotificationSlice';

import { ConfirmationDialog } from './components/ConfirmationDialog/ConfirmationDialog';

export const NotificationHandler = ({ type }) => {
  const confirmation = useSelector(selectCurrentUserNotification);
  const { isOpen, title, description } = confirmation;

  switch (type) {
    case 'confirmation':
      return (
        <ConfirmationDialog
          isOpen={isOpen}
          title={title}
          description={description}
        />
      );
    case 'alert':
      return null;
    case 'notification':
      return null;
    default:
      return null;
  }
};
