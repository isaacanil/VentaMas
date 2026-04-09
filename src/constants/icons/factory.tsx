import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

export const iconElement = (icon: IconDefinition) => (
  <FontAwesomeIcon icon={icon} />
);

export const createIconComponent = (
  icon: IconDefinition,
  displayName?: string,
) => {
  type IconComponentProps = Omit<FontAwesomeIconProps, 'icon'>;
  const Component = (props: IconComponentProps) => (
    <FontAwesomeIcon icon={icon} {...props} />
  );

  if (displayName) {
    Component.displayName = displayName;
  }

  return Component;
};
