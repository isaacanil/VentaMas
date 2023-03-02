function orderColumns(columns, order) {
    const orderedColumns = [];
    order.forEach((name) => {
      const column = columns.find((c) => c.key === name);
      if (column) {
        orderedColumns.push(column);
      }
    });
    return orderedColumns;
  }
  
  export default orderColumns;