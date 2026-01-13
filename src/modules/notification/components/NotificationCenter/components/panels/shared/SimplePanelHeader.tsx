import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Badge, Tooltip } from 'antd';
import {
  PanelHeader as PanelHeaderContainer,
  PanelTitle,
  PanelMetaGroup,
  PanelMetaItem,
  PanelMetaLabel,
  PanelMetaValue,
} from './PanelPrimitives';
import type { SimplePanelHeaderProps } from '@/types/ui';

const SimplePanelHeader = ({
  icon,
  title,
  badgeCount = 0,
  metaItems = [],
  showMeta = true,
}: SimplePanelHeaderProps) => (
  <PanelHeaderContainer>
    <PanelTitle>
      {icon && <FontAwesomeIcon icon={icon} />}
      {title}
      {badgeCount > 0 && <Badge count={badgeCount} style={{ marginLeft: 8 }} />}
    </PanelTitle>
    {showMeta && metaItems.length > 0 && (
      <PanelMetaGroup>
        {metaItems.map(({ label, value, hint }) => {
          const content = (
            <PanelMetaItem key={label}>
              <PanelMetaLabel>{label}</PanelMetaLabel>
              <PanelMetaValue>{value}</PanelMetaValue>
            </PanelMetaItem>
          );

          if (hint) {
            return (
              <Tooltip title={hint} key={label}>
                {content}
              </Tooltip>
            );
          }

          return content;
        })}
      </PanelMetaGroup>
    )}
  </PanelHeaderContainer>
);

export default SimplePanelHeader;