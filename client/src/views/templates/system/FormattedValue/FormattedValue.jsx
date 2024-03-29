import styled from "styled-components"
import { useFormatNumber } from "../../../../hooks/useFormatNumber"
import { useFormatDate } from "../../../../hooks/useFormatTime"
import { useFormatPrice } from "../../../../hooks/useFormatPrice"
import { DateTime } from "luxon";

const formatValue = (type, value) => {
  switch (type) {
    case 'number':
      return useFormatNumber(value);
    case 'date':
      return useFormatDate(value || DateTime.now().toMillis());
    case 'price':
      return useFormatPrice(value);
    default:
      return value;
  }
};

export const FormattedValue = ({ type, value, size, bold, noWrap, color, transformValue = true, align }) => {
  const formattedValue = transformValue ? formatValue(type, value) : value;

  if (type === 'text') {
    return <div>{value}</div>;
  }

  return (
    <Text size={size} bold={bold} color={color} noWrap={noWrap} type={type} align={align}>
      {formattedValue}
    </Text>
  );
};

const Text = styled.div`
height:min-content;
${({ type }) => type === 'title-large' && 'font-size: 28px; font-weight: 700; line-height: 1.4; color: #222222;'}
${({ type }) => type === 'title' && 'font-size: 22px; font-weight: 600; line-height: 1.4; color: #333333;'}
${({ type }) => type === 'subtitle' && 'font-size: 18px; font-weight: 500; line-height: 1.4; color: #333333;'}
${({ type }) => type === 'paragraph' && 'font-size: 16px; font-weight: 400; line-height: 1.6; letter-spacing: 0.02em; color: #555555;'}

  ${({ type }) => {
    switch (type) {
      case 'title-table':
        return 'font-size: 18px;font-weight: bold;color: var(--color);'
      case 'subtitle-table':
        return `
        font-size: 14px;
        font-weight: bold;
        text-transform: capitalize;
        font-family: 'Montserrat', sans-serif;
        `
      case 'paragraph-table':
        return `
        font-size: 14px;
        font-weight: 400;
        text-transform: capitalize;
        font-family: 'Azeret Mono', monospace;
        `
      default:
        return ''
    }
  }}

  ${({ size }) => size === 'xsmall' && 'font-size: 12px;'}
  ${({ size }) => size === 'small' && 'font-size: 14px;'}
  ${({ size }) => size === 'medium' && 'font-size: 16px;'}
  ${({ size }) => size === 'xmedium' && 'font-size: 18px;'}
  ${({ size }) => size === 'large' && 'font-size: 20px;'}
  ${({ size }) => size === 'xlarge' && 'font-size: 22px;'}

  ${({ noWrap }) => noWrap && `white-space: nowrap;`}

  ${({ bold }) => bold && 'font-weight: bold;'}
  ${({ align }) => {
    switch (align) {
      case 'center':
        return 'text-align: center;';
      case 'right':
        return 'text-align: right;';
      default:
        return 'text-align: left;';
    }
  }}
  ${({ color }) => color && `color: ${color};`}
  ${({ color }) => color === 'primary-main' && 'color: var(--color-main);'}
  ${({ color }) => color === 'secondary' && 'color: var(--color1);'}
  ${({ color }) => color === 'tertiary' && 'color: var(--color2);'}
  ${({ color }) => color === 'quaternary' && 'color: var(--color3);'}
  ${({ color }) => color === 'gray-dark' && 'color: var(--Gray8);'}
`;