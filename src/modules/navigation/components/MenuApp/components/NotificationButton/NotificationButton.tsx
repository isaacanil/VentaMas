import React from 'react';
import { useDispatch } from 'react-redux';

import { icons } from '@/constants/icons/icons';
import { openNotificationCenter } from '@/features/notification/notificationCenterSlice';
import { ButtonIconMenu } from '@/components/ui/Button/ButtonIconMenu';

type NotificationButtonProps = {
  handleCloseMenu?: () => void;
  className?: string;
  [key: string]: unknown;
};

export const NotificationButton = ({
  handleCloseMenu,
  className,
  ...rest
}: NotificationButtonProps) => {
  const dispatch = useDispatch();
  const handleOpenNotifications = () => {
    dispatch(openNotificationCenter());
    handleCloseMenu?.();
  };

  return (
    <ButtonIconMenu
      onClick={handleOpenNotifications}
      icon={icons.system.notification}
      className={className}
      {...rest}
    />
  );
};
