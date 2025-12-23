import { InputNumber } from 'antd';
import styled from 'styled-components';

import { FormattedValue } from '@/views/templates/system/FormattedValue/FormattedValue';

const THEME_COLOR_TO_CSS_VAR = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--error)',
  error: 'var(--error)',
  info: 'var(--info)',
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
};

const resolveThemeColor = (themeColor) => {
  if (!themeColor) return undefined;
  return THEME_COLOR_TO_CSS_VAR[themeColor] ?? themeColor;
};

export const InputWithHorizontalLabel = ({
  label = null,
  themeColor,
  style,
  ...inputProps
}) => {
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
const Container = styled.div`
  display: grid;
  align-items: center;
  align-content: center;
  padding: 0 0.4em;
  gap: 1em;
  ${({ $hasLabel }) =>
    $hasLabel &&
    `
        grid-template-columns: 10em 1fr;
    `}
`;
