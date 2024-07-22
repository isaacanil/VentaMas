const InvoiceItem = ({ description, quantity, unitPrice, total }) => (
    <tr>
      <td>{description}</td>
      <td>{quantity}</td>
      <td>{unitPrice.toFixed(2)}</td>
      <td>{total.toFixed(2)}</td>
    </tr>
  );
  
export default InvoiceItem;