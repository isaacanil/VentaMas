import React from 'react';
import { Form } from 'antd';

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