import type { TagProps } from 'antd';

import { StyledTag } from './Tag.styles';

export const Tag = ({ color = '#d9d9d9', ...props }: TagProps) => {
  return <StyledTag color={color} {...props} />;
};
