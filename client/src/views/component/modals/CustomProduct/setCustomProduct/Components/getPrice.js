export const getPrice = ({productSelected, setProduct, isComplete}) => {
    const a = productSelected.a ? JSON.parse(productSelected.a) : {};
    const b = productSelected.b ? JSON.parse(productSelected.b) : {};
    const firstProductPrice = a.price?.total || '';
    const secondProductPrice = b.price?.total || '';    
    const complete = isComplete === 'complete'
    const half = isComplete === 'half'
    switch (true) {
        case complete && firstProductPrice:
            console.log('completa y a tiene precio')
            setProduct({
                price: { unit: firstProductPrice, total: firstProductPrice }
            })
            return firstProductPrice
        case half && firstProductPrice > secondProductPrice:
            console.log('mitad y a es mayor que b')
            setProduct({
                price: { unit: firstProductPrice, total: firstProductPrice }
            })
            return firstProductPrice
        case half && firstProductPrice < secondProductPrice:
            console.log('mitad y a es menor que b')
            setProduct({
                price: { unit: secondProductPrice, total: secondProductPrice }
            })
            return secondProductPrice
        case half && firstProductPrice === secondProductPrice:
            console.log('mitad y a es igual que b')
            setProduct({
                price: { unit: firstProductPrice, total: firstProductPrice }
            })
            return firstProductPrice
        default:
            console.log('default')
            setProduct({
                price: { unit: firstProductPrice, total: firstProductPrice }
            })
            return firstProductPrice
    }
}