import type { InputNumberProps } from 'antd';
import { InputNumber } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import styled from 'styled-components';

import { FormattedValue } from '@/components/ui/FormattedValue/FormattedValue';

const THEME_COLOR_TO_CSS_VAR = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--error)',
  error: 'var(--error)',
  info: 'var(--info)',
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
};

type ThemeColorKey = keyof typeof THEME_COLOR_TO_CSS_VAR;

type InputWithHorizontalLabelProps = InputNumberProps & {
  label?: ReactNode;
  themeColor?: ThemeColorKey | string;
  style?: CSSProperties;
};

const resolveThemeColor = (themeColor?: ThemeColorKey | string) => {
  if (!themeColor) return undefined;
  return THEME_COLOR_TO_CSS_VAR[themeColor as ThemeColorKey] ?? themeColor;
};

export const InputWithHorizontalLabel = ({
  label = null,
  themeColor,
  style,
  ...inputProps
}: InputWithHorizontalLabelProps) => {
  const resolvedColor = resolveThemeColor(themeColor);

  return (
    <Container $hasLabel={Boolean(label)}>
      {label && (
        <FormattedValue
          size={'small'}
          type={'title'}
          value={label}
          color={resolvedColor}
        />
      )}
      <InputNumber
        prefix="$"
        {...inputProps}
        style={{ width: '100%', ...(style ?? {}) }}
      />
    </Container>
  );
};
const Container = styled.div<{ $hasLabel: boolean }>`
  display: grid;
  align-items: center;
  align-content: center;
  padding: 0 0.4em;
  gap: 1em;
  ${(props: { $hasLabel?: any }) =>
    props.$hasLabel &&
    `
        grid-template-columns: 10em 1fr;
    `}
`;
