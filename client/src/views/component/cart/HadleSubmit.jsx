import { useRef } from "react"
import { useSelector } from "react-redux"
import { useReactToPrint } from "react-to-print"
import { Receipt } from "../../pages/checkout/Receipt"

export const HandleSubmit = () => {
    const bill = useSelector(state => state.cart)
    return new Promise((resolve, reject) => {
        useReactToPrint({
            content: <Receipt ref={ComponentRef} data={bill} />
        })
    })

}







