import React, { useState } from 'react';
import styled from 'styled-components';



const BusinessInfo = ({ businessInfo, onSubmit }) => {
  const [name, setName] = useState(businessInfo && businessInfo.name || '');
  const [address, setAddress] = useState(businessInfo && businessInfo.address || '');
  const [phone, setPhone] = useState(businessInfo && businessInfo.phone || '');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ name, address, phone });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Wrapper>
        <Group>
          <label htmlFor="">

            Nombre:
          </label>
          <Input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Group>
        <Group>
          <label htmlFor="">

            Dirección:
          </label>
          <Input
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </Group>
        <Group>
          <label htmlFor="">
            Teléfono:
          </label>
          <Input
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Group>
        <Button type="submit">Guardar</Button>
      </Wrapper>

    </Form>
  );
};

export default BusinessInfo;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px;
`;

const Group = styled.div`
  margin-top: 10px;
  margin-bottom: 1.4em;
  font-size: 16px;

  label{
    position: absolute;
    margin-top: -20px;
    font-size: 16px;
    
  }
`;

const Input = styled.input`
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
  font-size: 16px;
  width: 300px;
  box-sizing: border-box;
`;

const Button = styled.button`
  margin-top: 20px;
  padding: 10px;
  background-color: #007bff;
  border: none;
  color: #fff;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
`;
const Wrapper = styled.div`
max-width: 600px;

`