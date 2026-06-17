import type { ReactNode } from 'react';

import type { SimplePanelHeaderProps } from '../types';
import { PanelCard, PanelStateBody } from './PanelPrimitives';
import SimplePanelHeader from './SimplePanelHeader';

type PanelStateCardProps = SimplePanelHeaderProps & {
  children: ReactNode;
  padding?: string;
};

export const PanelStateCard = ({
  badgeCount = 0,
  children,
  icon,
  metaItems,
  padding,
  showMeta = false,
  title,
}: PanelStateCardProps) => (
  <PanelCard>
    <SimplePanelHeader
      badgeCount={badgeCount}
      icon={icon}
      metaItems={metaItems}
      showMeta={showMeta}
      title={title}
    />
    <PanelStateBody $padding={padding}>{children}</PanelStateBody>
  </PanelCard>
);
