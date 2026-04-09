import { DateTime } from 'luxon';
import styled from 'styled-components';
import type { FormattedValueProps } from '@/types/ui';
import { formatNumber, formatPrice } from '@/utils/format';

const formatDateValue = (value: number | string | null | undefined): string => {
  const timestamp = value ?? DateTime.now().toMillis();
  return DateTime.fromMillis(Number(timestamp)).toLocaleString(
    DateTime.DATE_MED,
  );
};

const formatValue = (type: string | undefined, value: unknown): unknown => {
  if (type === 'number') {
    return formatNumber(value);
  }

  if (type === 'date') {
    return formatDateValue(value as number | string | null | undefined);
  }

  if (type === 'price') {
    return formatPrice(value);
  }

  return value;
};

export const FormattedValue = ({
  type,
  value,
  size,
  bold,
  noWrap,
  color,
  transformValue = true,
  align,
}: FormattedValueProps) => {
  const formattedValue = transformValue ? formatValue(type, value) : value;

  if (type === 'text') {
    return <div>{value}</div>;
  }

  return (
    <Text
      $size={size}
      $bold={bold}
      $color={color}
      $noWrap={noWrap}
      $type={type}
      $align={align}
    >
      {formattedValue}
    </Text>
  );
};

interface TextProps {
  $type?: string;
  $size?: string;
  $bold?: boolean;
  $noWrap?: boolean;
  $color?: string;
  $align?: 'left' | 'center' | 'right' | string;
}

const typeStyles = (props: TextProps) => {
  switch (props.$type) {
    case 'title-large':
      return 'font-size: 28px; font-weight: 700; line-height: 1.4; color: #222222;';
    case 'title':
      return 'font-size: 22px; font-weight: 600; line-height: 1.4; color: #333333;';
    case 'subtitle':
      return 'font-size: 18px; font-weight: 500; line-height: 1.4; color: #333333;';
    case 'paragraph':
      return 'font-size: 16px; font-weight: 400; line-height: 1.6; letter-spacing: 0.02em; color: #555555;';
    case 'title-table':
      return 'font-size: 18px;font-weight: bold;color: var(--color);';
    case 'subtitle-table':
      return `
        font-size: 14px;
        font-weight: bold;
        text-transform: capitalize;
        font-family: 'Poppins', sans-serif;
      `;
    case 'paragraph-table':
      return `
        font-size: 14px;
        font-weight: 400;
        text-transform: capitalize;
        font-family: 'Poppins', monospace;
      `;
    default:
      return '';
  }
};

const sizeStyles = (props: TextProps) => {
  switch (props.$size) {
    case 'xsmall':
      return 'font-size: 12px;';
    case 'small':
      return 'font-size: 14px;';
    case 'medium':
      return 'font-size: 16px;';
    case 'xmedium':
      return 'font-size: 18px;';
    case 'large':
      return 'font-size: 20px;';
    case 'xlarge':
      return 'font-size: 22px;';
    default:
      return '';
  }
};

const noWrapStyle = (props: TextProps) =>
  props.$noWrap ? 'white-space: nowrap;' : '';
const boldStyle = (props: TextProps) =>
  props.$bold ? 'font-weight: bold;' : '';

const alignStyles = (props: TextProps) => {
  switch (props.$align) {
    case 'center':
      return 'text-align: center;';
    case 'right':
      return 'text-align: right;';
    default:
      return 'text-align: left;';
  }
};

const colorStyles = (props: TextProps) => {
  const color = props.$color;

  if (!color) {
    return '';
  }

  if (
    color !== 'primary-main' &&
    color !== 'secondary' &&
    color !== 'tertiary' &&
    color !== 'quaternary' &&
    color !== 'gray-dark'
  ) {
    return `color: ${color};`;
  }

  if (color === 'primary-main') {
    return 'color: var(--color-main);';
  }

  if (color === 'secondary') {
    return 'color: var(--color1);';
  }

  if (color === 'tertiary') {
    return 'color: var(--color2);';
  }

  if (color === 'quaternary') {
    return 'color: var(--color3);';
  }

  if (color === 'gray-dark') {
    return 'color: var(--gray-8);';
  }

  return '';
};

const Text = styled.div<TextProps>`
  height: min-content;
  ${typeStyles}
  ${sizeStyles}
  ${noWrapStyle}
  ${boldStyle}
  ${alignStyles}
  ${colorStyles}
`;
