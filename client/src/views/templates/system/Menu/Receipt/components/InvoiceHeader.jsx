const InvoiceHeader = ({ companyName, address, phone }) => (
    <div>
      <h2>{companyName}</h2>
      <p>{address}</p>
      <p>{phone}</p>
    </div>
  );
  
export default InvoiceHeader;