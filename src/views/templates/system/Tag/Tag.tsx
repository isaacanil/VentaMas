import { Tag as AntdTag } from 'antd';

export const Tag = ({ color, children }) => {
  return (
    <AntdTag
      style={{ fontSize: '16px', padding: '5px' }}
      color={color}
      title="Hola"
    >
      {children}
    </AntdTag>
  );
};
