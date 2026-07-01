import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { createElement, type ReactNode } from 'react';
import type { MenuProps } from 'antd';

import type { ManageVendorBillControlAction } from '@/firebase/purchase/fbManageVendorBillControl';

import type { AccountsPayableControlActionDefinition } from './accountsPayableControlActions';

const ACTION_ICONS: Record<ManageVendorBillControlAction, ReactNode> = {
  approve: createElement(CheckCircleOutlined),
  request_approval: createElement(ClockCircleOutlined),
  reject: createElement(StopOutlined),
  place_hold: createElement(PauseCircleOutlined),
  release_hold: createElement(PlayCircleOutlined),
  open_dispute: createElement(WarningOutlined),
  resolve_dispute: createElement(CheckCircleOutlined),
  void: createElement(CloseCircleOutlined),
};

export const buildAccountsPayableControlMenuItems = ({
  actions,
  onSelect,
}: {
  actions: AccountsPayableControlActionDefinition[];
  onSelect: (action: ManageVendorBillControlAction) => void;
}): MenuProps['items'] =>
  actions.map((definition) => ({
    key: definition.action,
    danger: definition.tone === 'danger',
    icon: ACTION_ICONS[definition.action],
    label: definition.label,
    onClick: ({ domEvent }) => {
      domEvent?.stopPropagation();
      onSelect(definition.action);
    },
  }));
