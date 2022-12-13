import { useEffect, useState } from "react"

export const useScreenSize = (widthRef) => {
    const [width, setWidth] = useState(window.innerWidth)
    const getElementWidth = () => (
         widthRef.current.offsetWidth
        //widthRef.current.innerWidth
    )
    useEffect(() => {
        const handleResize = () => {
            setWidth(getElementWidth())
        }
        if (widthRef.current) {
            setWidth(getElementWidth())
        }
        window.addEventListener("resize", handleResize)
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [widthRef])

    return {
        width
    }
}