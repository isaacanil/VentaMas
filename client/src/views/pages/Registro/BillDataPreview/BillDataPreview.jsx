import React from "react";
import styled from "styled-components";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { BsFillPersonFill } from "react-icons/bs";
import { FaMoneyBillAlt } from "react-icons/fa";
import { GiShoppingCart } from "react-icons/gi";
import Products from "./components/Products";

const MainContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const GeneralInfoContainer = styled.div`
  margin-bottom: 20px;
`;

const ClientInfoContainer = styled.div`
  margin-bottom: 20px;
`;

const PurchaseInfoContainer = styled.div`
  margin-bottom: 20px;
`;

const PaymentInfoContainer = styled.div`
  margin-bottom: 20px;
`;

const DeliveryInfoContainer = styled.div`
  margin-bottom: 20px;
`;



const Title = styled.h2`
  margin-bottom: 10px;
  font-size: 24px;
`;

const Subtitle = styled.h3`
  margin-bottom: 10px;
  font-size: 18px;
`;

const Text = styled.p`
  margin-bottom: 5px;
  font-size: 16px;
`;

const IconContainer = styled.span`
  margin-right: 5px;
`;

const BillDataPreview = ({ data }) => {
  const {
    id,
    date,
    sourceOfPurchase,
    client,
    totalPurchase,
    change,
    totalPurchaseWithoutTaxes,
    totalTaxes,
    totalShoppingItems,
    discount,
    payment,
    paymentMethod,
    delivery,
    products,
  } = data;

  return (
    <MainContainer>
      <GeneralInfoContainer>
        <Title>Información general</Title>
        <Text>ID de compra: {id}</Text>
        <Text>Fecha: {new Date(date.seconds * 1000).toLocaleDateString()}</Text>
        <Text>Origen de la compra: {sourceOfPurchase}</Text>
      </GeneralInfoContainer>

      <ClientInfoContainer>
        <Title>Información del cliente</Title>
        <Text>
          <IconContainer>
            <BsFillPersonFill />
          </IconContainer>
          Nombre: {client.name}
        </Text>
        <Text>
          <IconContainer>
            <BsFillPersonFill />
          </IconContainer>
          ID personal: {client.personalID}
        </Text>
        <Text>
          <IconContainer>
            <BsFillPersonFill />
          </IconContainer>
          Teléfono: {client.tel}
        </Text>
        <Text>
          <IconContainer>
            <BsFillPersonFill />
          </IconContainer>
          Dirección: {client.address}
        </Text>
      </ClientInfoContainer>

      <PurchaseInfoContainer>
        <Title>Información de la compra</Title>
        <Text>
          <IconContainer>
            <FaMoneyBillAlt />
          </IconContainer>
          Total de la compra: RD$ {totalPurchase.value.toFixed(2)}
        </Text>
        <Text>
          <IconContainer>
            <FaMoneyBillAlt />
          </IconContainer>
          Cambio: RD$ {change.value.toFixed(2)}
        </Text>
        <Text>
          <IconContainer>
            <FaMoneyBillAlt />
          </IconContainer>
          Total de la compra sin impuestos  : RD$ {totalPurchaseWithoutTaxes.value.toFixed(2)}
    </Text>
    <Text>
      <IconContainer>
        <FaMoneyBillAlt />
      </IconContainer>
      Total de impuestos: RD$ {totalTaxes.value.toFixed(2)}
    </Text>
    <Text>
      <IconContainer>
        <GiShoppingCart />
      </IconContainer>
      Total de productos comprados: {totalShoppingItems.value}
    </Text>
    <Text>
      <IconContainer>
        <FaMoneyBillAlt />
      </IconContainer>
      Descuento aplicado: RD$ {discount.value.toFixed(2)}
    </Text>
  </PurchaseInfoContainer>

  <PaymentInfoContainer>
    <Title>Información del pago</Title>
    <Text>
      <IconContainer>
        <FaMoneyBillAlt />
      </IconContainer>
      Pago recibido: RD$ {payment.value.toFixed(2)}
    </Text>
    <Subtitle>Método de pago:</Subtitle>
    <ul>
      {paymentMethod.map((method, index) => (
        <li key={index}>
          {method.method} - RD$ {method.value.toFixed(2)}
        </li>
      ))}
    </ul>
  </PaymentInfoContainer>

  <DeliveryInfoContainer>
    <Title>Información de la entrega</Title>
    <Text>
      <IconContainer>
        <GiShoppingCart />
      </IconContainer>
      Estado de la entrega: {delivery.status ? "Entregado" : "Pendiente"}
    </Text>
    <Text>
      <IconContainer>
        <GiShoppingCart />
      </IconContainer>
      Valor de la entrega: {delivery.value}
    </Text>
  </DeliveryInfoContainer>

  <Products 
    products={products}
    Subtitle={Subtitle}
    Text={Text}
    Title={Title}
  />
    

</MainContainer>)}; 

export default BillDataPreview;
