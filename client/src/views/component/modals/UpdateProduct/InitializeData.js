export const initTaxes = [
    0,
    16,
    18,
]

export const taxLabel = ( tax ) => {
    switch (tax) {
        case 0:
            return 'Exento'
        case 16:
            return 'IVA 16%'
        case 18:
            return 'IVA 18%'
        default:
            return 'Exento'
    }
}