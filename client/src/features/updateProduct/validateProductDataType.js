export class productDataTypeCorrection {
    constructor({
        productName, 
        productImageURL, 
        category,
        cost, 
        price, 
        size, 
        type, 
        tax, 
        stock,
        netContent, 
        order, 
        barCode,
        qrCode,
        amountToBuy, 
        id, 
        isVisible,

        trackInventory
    }) {
        this.productName = String(productName);
        this.productImageURL = String(productImageURL);
        this.category = String(category);
        this.cost = {
            unit: Number(cost?.unit),
            total: Number(cost?.total)
        };
        this.price = {
            total: Number(price?.total),
            unit: Number(price?.unit)
        };
        this.barCode = String(barCode)
        this.qrCode = String(qrCode)
        this.size = String(size);
        this.type = String(type);
        this.tax = {
            unit: Number(tax?.unit),
            total: Number(tax?.total),
            ref: tax?.ref,  
            value: Number(tax?.value)  
        };
        this.stock = Number(stock);
        this.netContent = String(netContent);
        this.order = Number(order);
        this.amountToBuy = {
            unit: 1,
            total: 1
        };
        this.id = id;
        this.trackInventory = Boolean(trackInventory);
        this.isVisible = Boolean(isVisible)
    }
}
