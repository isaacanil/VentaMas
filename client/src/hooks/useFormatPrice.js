import { monetarySymbols } from "../constants/monetarySymbols"
import { separator } from "./separator"

export const useFormatPrice = (value, symbol = monetarySymbols.dollarSign) => {
 return `${symbol} ${separator(value)}`
}