import { Tag as AntdTag } from 'antd';

export const Tag = ({ color = '#d9d9d9', children }) => {
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
