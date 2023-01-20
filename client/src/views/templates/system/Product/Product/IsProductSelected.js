export const IsProductSelected = (array, id) => {
    const searchingAndSelected = array.find((item) => item.id === id)
    if(searchingAndSelected){
        console.log(searchingAndSelected.amountToBuy.total)
     return {status: true, productSelectedData: searchingAndSelected}
    }else{
     return {status: false, }
    }
 }