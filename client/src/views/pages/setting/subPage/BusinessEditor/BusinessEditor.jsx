import React, { Fragment, useEffect, useState } from 'react';
import styled from 'styled-components';
import BusinessProfileEditor from './BusinessEditorProfile';
import { MenuApp } from '../../../..';


const BusinessEditor = () => {
  return (
    <Fragment>
      <MenuApp/>
      < BusinessProfileEditor />
    </Fragment>
  );
};
export default BusinessEditor;

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
max-width: 500px;
width: 100%;
display: grid;
gap: 1em;

`