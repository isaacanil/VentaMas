import React from 'react';

import Tabs from '@/components/ui/Tabs/Tabs';
// import { ColorPairs } from '@/theme/ColorPalette'
import type { SettingsModalConfig } from '../../ConfigModal';

interface BodyProps {
  config?: SettingsModalConfig | null;
}

export const Body = ({ config }: BodyProps) => {
  const tabs = config?.tabs ?? [];
  return <Tabs tabPosition="left" tabs={tabs} />;
};
