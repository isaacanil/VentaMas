import InvoiceClientInfo from "./components/InvoiceClientInfo";
import InvoiceHeader from "./components/InvoiceHeader";
import InvoiceItemList from "./components/InvoiceItemList";
import InvoiceTotals from "./components/InvoiceTotals";

const Invoice = ({ header, clientInfo, items, totals }) => (
    <div>
      <InvoiceHeader {...header} />
      <InvoiceClientInfo {...clientInfo} />
      <InvoiceItemList items={items} />
      <InvoiceTotals {...totals} />
    </div>
  );
  
export default Invoice;