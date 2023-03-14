export const IsProductSelected = (array, id) => {
    const searchingAndSelected = array.find((item) => item.id === id)
    if(searchingAndSelected){
     return {status: true, productSelectedData: searchingAndSelected}
    }else{
     return {status: false, }
    }
 }