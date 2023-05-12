import styled from "styled-components"
import { useFormatNumber } from "../../../../hooks/useFormatNumber"
import { useFormatDate } from "../../../../hooks/useFormatTime"
import { useFormatPrice } from "../../../../hooks/useFormatPrice"

const formatValue = (type, value) => {
  switch (type) {
    case 'number':
      return useFormatNumber(value);
    case 'date':
      return useFormatDate(value);
    case 'price':
      return useFormatPrice(value);
    default:
      return value;
  }
};

export const FormattedValue = ({ type, value, size, bold, color, transformValue = true }) => {
  const formattedValue = transformValue ? formatValue(type, value) : value;

  if (type === 'text') {
    return <div>{value}</div>;
  }

  return (
    <Text size={size} bold={bold} color={color} type={type}>
      {formattedValue}
    </Text>
  );
};

const Text = styled.div`

  ${({ type }) => type === 'title' && 'font-size: 24px;font-weight: bold;'}
  ${({ type }) => type === 'subtitle' && 'font-size: 20px;font-weight: bold;'}
  ${({ type }) => type === 'paragraph' && 'font-size: 16px'}

  ${({ type }) => type === 'title-table' && 'font-size: 18px;font-weight: bold;color: var(--color);'}
  ${({ type }) => type === 'subtitle-table' && "font-size: 14px;font-weight: bold;text-transform: capitalize;font-family: 'Montserrat', sans-serif;"}
  ${({ type }) => type === 'paragraph-table' && 'font-size: 14px;'}

  ${({ size }) => size === 'xsmall' && 'font-size: 12px;'}
  ${({ size }) => size === 'small' && 'font-size: 14px;'}
  ${({ size }) => size === 'medium' && 'font-size: 16px;'}
  ${({ size }) => size === 'xmedium' && 'font-size: 18px;'}
  ${({ size }) => size === 'large' && 'font-size: 20px;'}
  ${({ size }) => size === 'xlarge' && 'font-size: 22px;'}

  ${({ bold }) => bold && 'font-weight: bold;'}

  ${({ color }) => color && `color: ${color};`}
  ${({ color }) => color === 'primary-main' && 'color: var(--color-main);'}
  ${({ color }) => color === 'secondary' && 'color: var(--color1);'}
  ${({ color }) => color === 'tertiary' && 'color: var(--color2);'}
  ${({ color }) => color === 'quaternary' && 'color: var(--color3);'}
  ${({ color }) => color === 'gray-dark' && 'color: var(--Gray8);'}
`;