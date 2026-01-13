import React from 'react';
import { useSelector } from 'react-redux';

import { selectCurrentUserNotification } from '@/features/UserNotification/UserNotificationSlice';

import { ConfirmationDialog } from './components/ConfirmationDialog/ConfirmationDialog';

type NotificationType = 'confirmation' | 'alert' | 'notification';

type UserNotificationState = {
  isOpen: boolean;
  title?: string | null;
  description?: string | null;
  onConfirm?: string | null;
};

type NotificationHandlerProps = {
  type: NotificationType;
};

export const NotificationHandler = ({ type }: NotificationHandlerProps) => {
  const confirmation = useSelector(
    selectCurrentUserNotification,
  ) as UserNotificationState;
  const { isOpen, title, description } = confirmation;

  switch (type) {
    case 'confirmation':
      return (
        <ConfirmationDialog
          isOpen={isOpen}
          title={title ?? ''}
          description={description ?? ''}
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
