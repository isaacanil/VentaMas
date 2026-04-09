import welcomeDataRaw from './WelcomeData.json';

import type { WelcomeData, WelcomeFeatureIcon } from './types';

const FEATURE_ICONS: WelcomeFeatureIcon[] = [
  'ShopOutlined',
  'DollarOutlined',
  'BarChartOutlined',
  'TeamOutlined',
  'SafetyOutlined',
  'CustomerServiceOutlined',
  'StarOutlined',
];

const isFeatureIcon = (value: string): value is WelcomeFeatureIcon =>
  FEATURE_ICONS.includes(value as WelcomeFeatureIcon);

const normalizeWelcomeData = (data: typeof welcomeDataRaw): WelcomeData => ({
  ...data,
  features: data.features.map((feature) => ({
    ...feature,
    icon: isFeatureIcon(feature.icon) ? feature.icon : 'StarOutlined',
  })),
});

export const welcomeData = normalizeWelcomeData(welcomeDataRaw);
