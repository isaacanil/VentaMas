import React, { useState } from "react";
import styled from "styled-components";
import { FaWindowClose } from "react-icons/fa";
import { Route, useNavigate } from "react-router-dom";


const items = () => {
  const navigate = useNavigate();
  const options = [
    {
      label: "Free space",
      fn: () => navigate("/"),
    },
    {
      label: "Task Manager",
      icon: <FaWindowClose />,
    },
    {
      label: "Control Panel",
      icon: <FaWindowClose />,
    },
    {
      label: "Task Manager",
      icon: <FaWindowClose />,
    },
    {
      label: "Control Panel",
      icon: <FaWindowClose />,
    },
  ];
  return options;
}


const RunMenu = ({ onClose }) => {
  const [searchValue, setSearchValue] = useState("");
  console.log(JSON.stringify(options))

  return (
    <Container>
      <CloseButton onClick={onClose}>
        <FaWindowClose />
      </CloseButton>
      <Input
        type="text"
        placeholder="Type the name of a program, folder, document, or Internet resource, and Windows will open it for you."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
      <Menu>
        {filteredItems.map((item, index) => (
          <MenuItem key={index}>
            <Label>{item.label}</Label>
          </MenuItem>
        ))}
      </Menu>
    </Container>
  );
};

export default RunMenu;

const Container = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;


  padding: 10px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #555;
  }
`;
const Menu = styled.div`
  overflow-y: auto;
  height: 140px;
  `
const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 1.2rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  outline: none;

  &:focus {
    border-color: #555;
  }
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f7f7f7;
  }
`;

const Icon = styled.div`
  margin-right: 10px;
`;

const Label = styled.div`
  flex: 1;
`;