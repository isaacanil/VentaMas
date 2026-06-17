import { MoreOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { forwardRef } from 'react';

export const ActionMenuButton = forwardRef<HTMLButtonElement>((props, ref) => (
  <Button ref={ref} icon={<MoreOutlined />} {...props} />
));
ActionMenuButton.displayName = 'ActionMenuButton';
