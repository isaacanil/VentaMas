import React from 'react';
import { useDispatch } from 'react-redux';

import { icons } from '../../../../../constants/icons/icons';
import { openNotificationCenter } from '../../../../../features/notification/notificationCenterSlice';
import { ButtonIconMenu } from '../../../system/Button/ButtonIconMenu';

export const NotificationButton = ({
  handleCloseMenu = () => {},
  className,
  ...rest
}) => {
  const dispatch = useDispatch();
  const handleOpenNotifications = () => {
    dispatch(openNotificationCenter('taxReceipt'));
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
