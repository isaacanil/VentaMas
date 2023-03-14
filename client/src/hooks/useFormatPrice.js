import { monetarySymbols } from "../constants/monetarySymbols"
import { separator } from "./separator"

export const useFormatPrice = (value, symbol = monetarySymbols.dollarSign) => {
    switch (symbol) {
        case 'rd':
            return `${monetarySymbols.rd}  ${separator(value)}`
        case 'euro':
            return `${monetarySymbols.euroSign}  ${separator(value)}`
        case 'pound':
            return `${monetarySymbols.poundSign}  ${separator(value)}`
        default:
            return `${monetarySymbols.dollarSign}  ${separator(value)}`
    }
}