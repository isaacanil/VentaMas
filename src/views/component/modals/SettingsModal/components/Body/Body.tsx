// @ts-nocheck
import React from 'react';

import Tabs from '@/views/templates/system/Tabs/Tabs';
// import { ColorPairs } from '@/theme/ColorPalette'

export const Body = ({ config }) => {
  return <Tabs tabPosition="left" tabs={config?.tabs} />;
};
