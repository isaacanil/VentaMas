import { Form } from 'antd';
import React from 'react';

export const FilterField = ({ label, children, style }) => (
  <Form.Item label={label} style={{ marginBottom: 0, ...style }}>
    {children}
  </Form.Item>
);

export const CollapsibleItem = ({ index, registerRef, children }) => (
  <div ref={registerRef(index)} style={{ display: 'inline-flex' }}>
    {children}
  </div>
); 