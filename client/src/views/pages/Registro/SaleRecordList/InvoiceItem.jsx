import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: #f9f9f9;
  border-radius: 4px;
  padding: 20px;
  margin: 20px;
  font-family: 'Arial', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const Button = styled.button`
  background-color: #4caf50;
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
`;

const Title = styled.h2`
  margin: 0;
`;

const Subtitle = styled.h4`
  margin: 0;
  color: #666;
  font-weight: normal;
`;

const TotalAmount = styled.div`
  font-size: 1.5em;
  color: #333;
`;

export const InvoiceItem = ({ data }) => {


    const client = data?.client || {};
    const totalPurchaseWithoutTaxes = data?.totalPurchaseWithoutTaxes;
    const discount = data?.discount;
    const totalTaxes = data?.totalTaxes;
    const totalPurchase = data?.totalPurchase;
    const paymentMethod = data?.paymentMethod;
    const totalShoppingItems = data?.totalShoppingItems;
    const date = data?.date;


    // Function to convert UNIX timestamp to readable format
    const formatDate = (seconds) => {
        if(!seconds) return new Date().toLocaleString();    
        const date = new Date(seconds * 1000);
        return date.toLocaleString();
    };

    // Only showing cash payment if it's true
    const cashPayment = ''

    return (
        <Container>
            <Header>
                <div>
                    <Title>Invoice #</Title>
                    <Subtitle>{client?.name}</Subtitle>
                    <div>Date: {formatDate(date?.seconds)}</div>
                </div>
                <TotalAmount>Total: ${totalPurchase?.value.toFixed(2)}</TotalAmount>
            </Header>
            <div>
                <p>Subtotal without taxes: ${totalPurchaseWithoutTaxes?.value.toFixed(2)}</p>
                <p>Discount: ${discount?.value.toFixed(2)}</p>
                <p>Taxes: ${totalTaxes?.value.toFixed(2)}</p>
                <p>Number of Items: {totalShoppingItems?.value}</p>
                <p>Payment Method: {cashPayment ? 'Cash' : 'Other'}</p>
            </div>
            <Footer>
                <Button>Edit</Button>
                <Button>Print</Button>
                <Button>See More</Button>
            </Footer>
        </Container>
    );
};

