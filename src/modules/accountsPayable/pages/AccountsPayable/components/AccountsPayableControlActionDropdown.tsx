import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Dropdown, Tooltip } from 'antd';
import styled from 'styled-components';

import type { ManageVendorBillControlAction } from '@/firebase/purchase/fbManageVendorBillControl';

import { buildAccountsPayableControlMenuItems } from '../utils/accountsPayableControlMenuItems';
import { getAccountsPayableControlActions } from '../utils/accountsPayableControlActions';
import type { AccountsPayableRow } from '../utils/accountsPayableDashboard';

interface AccountsPayableControlActionDropdownProps {
  buttonLabel?: string;
  canManageAction?: (action: ManageVendorBillControlAction) => boolean;
  disabledReason?: string;
  disabled?: boolean;
  onSelectAction: (
    row: AccountsPayableRow,
    action: ManageVendorBillControlAction,
  ) => void;
  row: AccountsPayableRow;
  size?: 'small' | 'middle' | 'large';
}

export const AccountsPayableControlActionDropdown = ({
  buttonLabel = 'Control CxP',
  canManageAction = () => true,
  disabledReason,
  disabled,
  onSelectAction,
  row,
  size = 'middle',
}: AccountsPayableControlActionDropdownProps) => {
  const rowActions = getAccountsPayableControlActions(row);
  const actions = rowActions.filter((definition) =>
    canManageAction(definition.action),
  );
  const items = buildAccountsPayableControlMenuItems({
    actions,
    onSelect: (action) => onSelectAction(row, action),
  });
  const noActionsReason =
    rowActions.length === 0
      ? 'No hay acciones de control disponibles para este estado.'
      : (disabledReason ?? 'Tu rol no puede gestionar controles de CxP.');
  const isDisabled = disabled || actions.length === 0;

  return (
    <Tooltip title={isDisabled ? noActionsReason : ''}>
      <span>
        <Dropdown
          disabled={isDisabled}
          menu={{ items }}
          placement="bottomRight"
          trigger={['click']}
        >
          <ControlButton
            disabled={isDisabled}
            icon={<ExclamationCircleOutlined />}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            size={size}
          >
            {buttonLabel}
          </ControlButton>
        </Dropdown>
      </span>
    </Tooltip>
  );
};

const ControlButton = styled(Button)`
  max-width: 100%;
`;
