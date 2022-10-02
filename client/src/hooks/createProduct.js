export const handleCreateProduct = async () => {
    

    /****************************************************************** */
    const extentionsFile = /.jpg|.jpeg|.png| .gif/i;
    if (!extentionsFile.exec(productImage.name)) {
       console.log(product.productImage.name)
       setErrorMassage(<ErrorMessage text='Error de archivo (no es una imagen)'></ErrorMessage>)
    } else {
       setErrorMassage('')
       //referencia
       UploadProdImg(productImage).then((url) => UploadProdData(
          url, 
          productName,
          cost,
          taxe,
          stock,
          category,
          netContent,
          ))
      
       try {
          
          
          return <Navigate to={'/app/'}></Navigate>
       }
       catch (e) {
          console.error("Error adding document: ", e)
       }
    }
    /******************************************************************************** */
    

 }