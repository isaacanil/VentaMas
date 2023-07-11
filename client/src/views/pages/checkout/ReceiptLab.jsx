// Importaciones necesarias
import React from 'react';
import styled from 'styled-components';
import { DateTime } from 'luxon';
import { Receipt } from './Receipt';

// Estilos
const Container = styled.div`
  max-width: 400px;
 
`;

// Componente de recibo de compras
const ReciboCompras = (props, ref) => {
  const data = {
    "id": "h9MJ5JHM",
    "client": {
      "name": "Nicole DJ",
      "tel": "",
      "address": "santo domingo",
      "personalID": "",
      "delivery": {
        "status": true,
        "value": 800
      },
      "id": "eaerPipo"
    },
    "products": [
      {
        "salePrice": "",
        "productName": "Paleta magnum",
        "seller": "",
        "initialCost": "",
        "type": "Paleta",
        "profit": "",
        "cost": {
          "total": 127.1186,
          "unit": 127.1186
        },
        "trackInventory": true,
        "size": "Normal",
        "tax": {
          "ref": "18%",
          "unit": 0.18,
          "value": 0.18,
          "total": 0
        },
        "stock": -24,
        "shipping": "",
        "reviews": "",
        "category": "Helado",
        "order": 0,
        "barcode": "",
        "rating": "",
        "description": "",
        "price": {
          "unit": 149.999948,
          "total": 149.999948
        },
        "id": "75DlB9",
        "productImageURL": "https://firebasestorage.googleapis.com/v0/b/hipizza-1b9cc.appspot.com/o/products%2Fefe642e8-cfeb-4e1f-b8bf-03bad31cc9c7.jpg?alt=media&token=ff33988c-ba03-48f1-aa4a-6b8876a3789c",
        "profitMargin": "",
        "surcharge": "",
        "margin": "",
        "warranty": "",
        "available": "",
        "amountToBuy": {
          "unit": 1,
          "total": 1
        },
        "netContent": "paleta"
      },
      {
        "available": "",
        "description": "",
        "seller": "",
        "trackInventory": true,
        "size": "unidad",
        "type": "Camita de queso",
        "tax": {
          "value": 0.18,
          "total": 0.54,
          "unit": 0.18,
          "ref": "18%"
        },
        "category": "Camitas de Queso",
        "rating": "",
        "productImageURL": "https://firebasestorage.googleapis.com/v0/b/hipizza-1b9cc.appspot.com/o/products%2F424c2c78-a425-4b13-90c3-f7bc77836c60.jpg?alt=media&token=a4b2eb19-5c51-4c99-888e-17f4201840fb",
        "netContent": "",
        "shipping": "",
        "profit": "",
        "amountToBuy": {
          "unit": 1,
          "total": 1
        },
        "productName": "CAMITAS DE QUESO",
        "price": {
          "total": 289.999986,
          "unit": 289.999986
        },
        "order": 1,
        "cost": {
          "unit": 245.7627,
          "total": 245.7627
        },
        "margin": "",
        "salePrice": "",
        "initialCost": "",
        "id": "1W8-FW",
        "surcharge": "",
        "reviews": "",
        "stock": -35,
        "profitMargin": "",
        "warranty": "",
        "barcode": ""
      },
      {
        "order": 1,
        "salePrice": "",
        "type": "Cerveza",
        "rating": "",
        "reviews": "",
        "netContent": "",
        "barcode": "",
        "stock": -8,
        "description": "",
        "productName": "CERVEZA CORONA",
        "warranty": "",
        "amountToBuy": {
          "total": 1,
          "unit": 1
        },
        "cost": {
          "total": 127.1186,
          "unit": 127.1186
        },
        "id": "_hqDr6",
        "initialCost": "",
        "profitMargin": "",
        "profit": "",
        "margin": "",
        "available": "",
        "shipping": "",
        "trackInventory": true,
        "category": "Cerveza",
        "seller": "",
        "price": {
          "unit": 149.999948,
          "total": 149.999948
        },
        "size": "1",
        "tax": {
          "value": 0.18,
          "unit": 0,
          "ref": "18%",
          "total": 0
        },
        "productImageURL": "https://firebasestorage.googleapis.com/v0/b/hipizza-1b9cc.appspot.com/o/products%2F72ea63cf-134a-4c0b-ba96-dcd318445f1b.jpg?alt=media&token=b1f3889c-a618-495a-a602-12d31c75a941",
        "surcharge": ""
      },
      {
        "price": {
          "total": 730,
          "unit": 730
        },
        "netContent": "1",
        "id": "FZiCE0",
        "cost": {
          "unit": 618.644,
          "total": 618.644
        },
        "category": "Pizza Familiar",
        "amountToBuy": {
          "unit": 1,
          "total": 1
        },
        "tax": {
          "value": 0.18,
          "total": 0,
          "unit": 0,
          "ref": "18%"
        },
        "size": "Familiar",
        "productName": "Pizza de Pepperoni Familiar",
        "trackInventory": false,
        "stock": 0,
        "order": 1,
        "barCode": "undefined",
        "type": "pizza",
        "productImageURL": "https://firebasestorage.googleapis.com/v0/b/ventamaxpos.appspot.com/o/businesses%2FEDW44d69fhdvE5QmuL2I%2FproductsImages%2F1e032f1c-2e09-4386-986d-9606a145b662.jpg?alt=media&token=9fbd8802-97d1-4539-a3be-5d78cbb4f33c"
      },
      {
        "stock": 0,
        "size": "Familiar",
        "category": "Pizza Familiar",
        "price": {
          "unit": 720,
          "total": 720
        },
        "order": 3,
        "amountToBuy": {
          "unit": 1,
          "total": 1
        },
        "type": "pizza",
        "cost": {
          "unit": 610.1694,
          "total": 610.1694
        },
        "tax": {
          "unit": 0,
          "value": 0.18,
          "ref": "18%",
          "total": 0
        },
        "id": "hMcrM7",
        "netContent": "1",
        "productImageURL": "https://firebasestorage.googleapis.com/v0/b/hipizza-1b9cc.appspot.com/o/products%2Fda131ff3-3b6d-40c7-8521-7465d455dca1.jpg?alt=media&token=b23bdd3d-d1e7-4c0a-8534-5cfccc8524f0",
        "trackInventory": false,
        "productName": "Pizza de Maíz Familiar"
      }
    ],
    "change": {
      "value": 0
    },
    "delivery": {
      "status": true,
      "value": 800
    },
    "discount": {
      "value": 0
    },
    "paymentMethod": [
      {
        "method": "cash",
        "value": 2839.999882,
        "status": true
      },
      {
        "method": "card",
        "value": 0,
        "status": false
      },
      {
        "method": "transfer",
        "value": 0,
        "status": false
      }
    ],
    "NCF": null,
    "totalShoppingItems": {
      "value": 5
    },
    "totalPurchaseWithoutTaxes": {
      "value": 1728.8133
    },
    "totalTaxes": {
      "value": 367.19997876
    },
    "payment": {
      "value": 2839.999882
    },
    "totalPurchase": {
      "value": 2839.999882
    },
    "sourceOfPurchase": "Presencial"
  }

  return (
    <Container >
      <Receipt data={data} ref={ref}></Receipt>
    </Container>
  );
};

export default React.forwardRef(ReciboCompras);
