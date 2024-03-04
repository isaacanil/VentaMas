export const getPrice = ({ productSelected, setProduct, isComplete }) => {
    const a = productSelected.a ? JSON.parse(productSelected.a) : {};
    const b = productSelected.b ? JSON.parse(productSelected.b) : {};

    const firstProductPrice = a?.pricing?.price || '';
    const secondProductPrice = b?.pricing?.price || '';

    const complete = isComplete === 'complete'
    const half = isComplete === 'half'

    switch (true) {
        case complete && firstProductPrice:
            console.log('completa y a tiene precio')
            setProduct({
                pricing: {
                    price: firstProductPrice,
                }
            })
            return firstProductPrice
        case half && firstProductPrice > secondProductPrice:
            console.log('mitad y a es mayor que b')
            setProduct({
                pricing: {
                    price: firstProductPrice,
                }
            })
            return firstProductPrice
        case half && firstProductPrice < secondProductPrice:
            console.log('mitad y a es menor que b')
            setProduct({
                pricing: {
                    price: secondProductPrice,
                }
            })
            return secondProductPrice
        case half && firstProductPrice === secondProductPrice:
            console.log('mitad y a es igual que b')
            setProduct({
                pricing: {
                    price: firstProductPrice,
                }
            })
            return firstProductPrice
        default:
            console.log('default')
            setProduct({
                pricing: {
                    price: firstProductPrice,
                }
            })
            return firstProductPrice
    }
}