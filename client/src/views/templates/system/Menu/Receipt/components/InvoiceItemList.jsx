import InvoiceItem from "./InvoiceItem";

const InvoiceItemList = ({ items }) => (
    <table>
      <thead>
        <tr>
          <th>DESCRIPCIÓN</th>
          <th>CANTIDAD</th>
          <th>PRECIO UNITARIO</th>
          <th>TOTAL</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <InvoiceItem
            key={index}
            description={item.description}
            quantity={item.quantity}
            unitPrice={item.unitPrice}
            total={item.total}
          />
        ))}
      </tbody>
    </table>
  );
  
export default InvoiceItemList;