import React, { useEffect, useState } from 'react'
import * as ant from 'antd';
const { Form, Button, Spin, Card, Space, Row, Col, Tabs } = ant;

import styled from 'styled-components';
import { General } from './components/General/General';
import BatchList from './components/Batch/BatchList/BatchList';
import { useSelector } from 'react-redux';
import { selectUpdateProductData } from '../../../../features/updateProduct/updateProductSlice';

export const ProductForm = ({ showImageManager }) => {
    const { product, status } = useSelector(selectUpdateProductData)
    const items = [
        {
            key: '1',
            label: 'General',
            children: <General showImageManager={showImageManager} />
        },
        {
            key: '2',
            label: 'Lote',
            disabled: status === "create",
            children: <BatchList/>
        }
    ]
    return (
        <Tabs
            defaultActiveKey="1"
            items={items}
        />
    )
}

const ImageContent = styled.div`
    border-radius: 5px;
    height: 150px;
    overflow: hidden;
`
const ImageContainer = styled.div`
    height: 100%;
   width: 100%;
  `;

const Image = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  `;
const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    align-items: center;
    padding: 10px 0px 0px;
    margin-top: 20px;
    width: 100%;
    `