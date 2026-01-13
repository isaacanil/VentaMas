import { Form } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import React from 'react';

type FilterFieldProps = {
  label?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
};

type CollapsibleItemProps = {
  index: number;
  registerRef: (index: number) => (node: HTMLDivElement | null) => void;
  children?: ReactNode;
};

export const FilterField = ({ label, children, style }: FilterFieldProps) => (
  <Form.Item
    label={label}
    style={{
      marginBottom: 0,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    {children}
  </Form.Item>
);

export const CollapsibleItem = ({ index, registerRef, children }: CollapsibleItemProps) => (
  <div ref={registerRef(index)} style={{ display: 'inline-flex' }}>
    {children}
  </div>
);
