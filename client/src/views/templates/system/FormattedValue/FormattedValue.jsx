import styled from "styled-components"
import { useFormatNumber } from "../../../../hooks/useFormatNumber"
import { useFormatDate } from "../../../../hooks/useFormatTime"
import { useFormatPrice } from "../../../../hooks/useFormatPrice"



export const FormattedValue = ({ type, value, size, bold, color, transformValue=true }) => {
  switch (type) {
    case 'number':
      return (
        <Text
          size={size}
          bold={bold}
          color={color}
          type={type}
        >
          <NumberContainer>
            {transformValue && useFormatNumber(value)}
            {!transformValue && value}
          </NumberContainer>
        </Text>
      )
    case 'date':
      return (
        <Date>
          {transformValue && useFormatDate(value)}
          {!transformValue && value}
        </Date>
      )
      case 'price':
        return (
          <Date>
            {transformValue && useFormatPrice(value)}
            {!transformValue && value}
          </Date>
        )
    case 'text':
      return (
        <div>{value}</div>
      )
      case 'subtitle-table':
      return (
        <Text
          type={'subtitle-table'}
        >
          {value}
        </Text>
      )
    default:
      return (
        <div>FormatedValue</div>
      )

  }
}
const NumberContainer = styled.div`


`
const Date = styled.div`

 
`
const Text = styled.div`
/* ************************************* General Text ***************************************************** */
  ${({ type }) => type === "title" && `
  font-size: 24px;
  font-weight: bold;
  `}
  ${({ type }) => type === "subtitle" && `
  font-size: 20px;
  font-weight: bold;
  `}
  ${({ type }) => type === "paragraph" && `
  font-size: 16px
  `}

/***************************************** TABLE *************************************************** */ 
  ${({ type }) => type === "title-table" && `
  font-size: 18px; 
  font-weight: bold;
  color: var(--color);
  `}
  ${({ type }) => type === "subtitle-table" && `
  font-size: 14px;
  font-weight: bold;
  text-transform: capitalize;
  font-family: 'Montserrat', sans-serif;
  `}
  ${({ type }) => type === "paragraph-table" && `
  font-size: 14px;
  `}

  /** ************************************* SIZE **************************************************** */
  ${({ size }) => size === "xsmall" && `font-size: 12px;`}
  ${({ size }) => size === "small" && `font-size: 14px;`}
  ${({ size }) => size === "medium" && `font-size: 16px;`}
  ${({ size }) => size === "xmedium" && `font-size: 18px;`}
  ${({ size }) => size === "large" && `font-size: 20px;`}
  ${({ size }) => size === "xlarge" && `font-size: 22px;`}

  /***************************************** Bold ******************************************************* */
  ${({ bold }) => bold && `font-weight: bold;`}

  /***************************************** COLOR ******************************************************* */
  ${({ color }) => color && `primary: ${color};`}
  ${({ color }) => color === "primary-main" && `color: var(--color-main);`}
  ${({ color }) => color === "secondary" && `color: var(--color1);`}
  ${({ color }) => color === "tertiary" && `color: var(--color2);`}
  ${({ color }) => color === "quaternary" && `color: var(--color3);`}
   ${({ color }) => color === "gray-dark" && `color: var(--Gray8);`}

  /***************************************** TYPE ******************************************************* */
  
`