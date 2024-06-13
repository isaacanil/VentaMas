
export const separator = (numb) => {
    var toNumber = Number(numb)
    if(isNaN(toNumber)) return (0)
    var n = toNumber.toFixed(2)
    var str = n.toString().split(".");
    str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return str.join(".");
}