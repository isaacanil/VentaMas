import type { CSSProperties, ReactNode } from 'react';
import React from 'react';
import styled from 'styled-components';

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
  <Field style={style}>
    {label ? <FieldLabel>{label}</FieldLabel> : null}
    {children}
  </Field>
);

export const CollapsibleItem = ({
  index,
  registerRef,
  children,
}: CollapsibleItemProps) => (
  <div ref={registerRef(index)} style={{ display: 'inline-flex' }}>
    {children}
  </div>
);

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  width: 100%;
  min-width: 0;
`;

const FieldLabel = styled.span`
  color: var(--ds-color-text-secondary, #666);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
`;
