import React, { Fragment, useState } from "react";
import styled from "styled-components";

const PizzaModal = () => {
    const [pizzaType, setPizzaType] = useState("complete");
    const [size, setSize] = useState("small");
    const [leftTopping, setLeftTopping] = useState("");
    const [rightTopping, setRightTopping] = useState("");

    const handlePizzaTypeChange = (event) => {
        setPizzaType(event.target.value);
    };

    const handleSizeChange = (event) => {
        setSize(event.target.value);
    };

    const handleLeftToppingChange = (event) => {
        setLeftTopping(event.target.value);
    };

    const handleRightToppingChange = (event) => {
        setRightTopping(event.target.value);
    };

    return (
        <ModalWrapper>
            <Header>Personaliza tu pizza</Header>
            <Form>
                <FormGroup>
                    <Label>Tipo de pizza:</Label>
                    <Select value={pizzaType} onChange={handlePizzaTypeChange}>
                        <Option value="complete">Completa</Option>
                        <Option value="half">Mitad y mitad</Option>
                    </Select>
                </FormGroup>
                <FormGroup>
                    <Label>Tamaño:</Label>
                    <Select value={size} onChange={handleSizeChange}>
                        <Option value="small">Chica</Option>
                        <Option value="medium">Mediana</Option>
                        <Option value="large">Grande</Option>
                    </Select>
                </FormGroup>
                {pizzaType === "complete" ? (
                    <FormGroup>
                        <Label>Elige tus ingredientes:</Label>
                        <Select>
                            <Option value="pepperoni">Pepperoni</Option>
                            <Option value="jam">Jamón</Option>
                            <Option value="mushroom">Champiñones</Option>
                        </Select>
                    </FormGroup>
                ) : (
                    <Fragment>
                        <FormGroup>
                            <Label>Mitad izquierda:</Label>
                            <Select value={leftTopping} onChange={handleLeftToppingChange}>
                                <Option value="pepperoni">Pepperoni</Option>
                                <Option value="jam">Jamón</Option>
                                <Option value="mushroom">Champiñones</Option>
                            </Select>
                        </FormGroup>
                        <FormGroup>
                            <Label>Mitad derecha:</Label>
                            <Select value={rightTopping} onChange={handleRightToppingChange}>
                                <Option value="pepperoni">Pepperoni</Option>
                                <Option value="jam">Jamón</Option>
                                <Option value="mushroom">Champiñones</Option>
                            </Select>
                        </FormGroup>
                    </Fragment>
                )}
                <Button>Ordenar</Button>
            </Form>
        </ModalWrapper>
    );
};

const ModalWrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  width: 500px;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0px 4px 8px`
    
  const Header = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 16px;
  font-weight: bold;
`;

const Select = styled.select`
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid gray;
  padding: 8px;
`;

const Option = styled.option``;

const Button = styled.button`
  margin-top: 24px;
  padding: 8px 16px;
  font-size: 16px;
  background-color: #f6a40f;
  color: white;
  border-radius: 4px;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #ee9610;
  }
`;

export default PizzaModal;

  
