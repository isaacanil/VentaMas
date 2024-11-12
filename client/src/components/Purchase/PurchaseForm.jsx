
import React from 'react';
import { Form, Card, Tabs } from 'antd';
import GeneralTab from './Tabs/GeneralTab';
import ProductsTab from './Tabs/ProductsTab';
import TotalsTab from './Tabs/TotalsTab';
import EvidenceTab from './Tabs/EvidenceTab';

const { TabPane } = Tabs;

const PurchaseForm = ({ purchaseData, handleInputChange, handleProductChange, addProduct, calculateTotals }) => {
  return (
    <Form layout="vertical">
      <Card>
        <Tabs defaultActiveKey="general">
          <TabPane tab="General" key="general">
            <GeneralTab purchaseData={purchaseData} handleInputChange={handleInputChange} />
          </TabPane>

          <TabPane tab="Productos" key="products">
            <ProductsTab 
              products={purchaseData.products}
              handleProductChange={handleProductChange}
              addProduct={addProduct}
            />
          </TabPane>

          <TabPane tab="Totales" key="totals">
            <TotalsTab totals={purchaseData.totals} />
          </TabPane>

          <TabPane tab="Evidencia" key="evidence">
            <EvidenceTab />
          </TabPane>
        </Tabs>
      </Card>
    </Form>
  );
};

export default PurchaseForm;