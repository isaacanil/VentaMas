export const SelectDataFromOrder = (array, name) => {
    const data = array.find((item) => item.name === name)
    return data
}