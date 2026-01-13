// @ts-nocheck
import React from 'react';

import Tabs from '@/components/ui/Tabs/Tabs';
// import { ColorPairs } from '@/theme/ColorPalette'

export const Body = ({ config }) => {
  return <Tabs tabPosition="left" tabs={config?.tabs} />;
};
