import { useState } from "react";
import styled from "styled-components";

const CreateProductModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [product, setProduct] = useState({
      productName: "",
      // ...Resto de las propiedades
      price: {
        unit: 0,
        total: 0,
      },
    });
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setProduct({ ...product, [name]: value });
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log("Producto creado:", product);
      // Aquí puede agregar la lógica para guardar el producto en su base de datos o API.
      setIsOpen(false);
    };
  
    const openModal = () => {
      setIsOpen(true);
    };
  
    const closeModal = () => {
      setIsOpen(false);
    };
  
    return (
      <>
        <OpenButton onClick={openModal}>Crear producto</OpenButton>
        {isOpen && (
          <ModalContainer>
            <ModalContent>
              <CloseButton onClick={closeModal}>X</CloseButton>
              <h2>Crear producto</h2>
              <form onSubmit={handleSubmit}>
                <label>
                  Nombre del producto:
                  <input
                    type="text"
                    name="productName"
                    value={product.productName}
                    onChange={handleChange}
                  />
                </label>
                {/* Repita este patrón para cada propiedad del objeto de producto */}
                <button type="submit">Guardar</button>
              </form>
            </ModalContent>
          </ModalContainer>
        )}
      </>
    );
  };
  
  export default CreateProductModal;
  
  const ModalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  width: 80%;
  max-width: 800px;
  background-color: white;
  padding: 20px;
  border-radius: 5px;
`;

const OpenButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 20px;
`;

const CloseButton = styled.button`
  background-color: #dc3545;
  color: white;
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  float: right;
  margin-bottom: 10px;
`;
