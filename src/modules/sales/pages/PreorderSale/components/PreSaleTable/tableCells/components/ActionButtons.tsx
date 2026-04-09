import { MoreOutlined } from '@/constants/icons/antd';
import { Button, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';

import { icons } from '@/constants/icons/icons';

type ActionButtonsProps = {
  menuItems: MenuProps['items'];
  onComplete: () => void;
  isCompletingPreorder: boolean;
};

export const ActionButtons = ({
  menuItems,
  onComplete,
  isCompletingPreorder,
}: ActionButtonsProps) => (
  <>
    <Tooltip title="Completar preventa">
      <Button
        icon={icons.editingActions.complete}
        loading={isCompletingPreorder}
        onClick={(event) => {
          event.stopPropagation();
          onComplete();
        }}
      />
    </Tooltip>
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <Button icon={<MoreOutlined />} onClick={(event) => event.stopPropagation()} />
    </Dropdown>
  </>
);
