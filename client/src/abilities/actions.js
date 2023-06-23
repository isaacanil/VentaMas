const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  SELL: 'sell',
  MANAGE: 'manage',
  REFUND: 'refund',
  CHECK_INVENTORY: 'checkInventory',
  RESTOCK: 'restock',
  HANDLE_RETURNS: 'handleReturns',
  GENERATE_REPORTS: 'generateReports',
};

const SUBJECTS = {
  ALL: 'all',
  USER: 'user',
  CLIENT: 'client',
  PROVIDER: 'provider',
  USER: 'user',
  CATEGORY: 'category',
  Invoice: 'invoice',
  ORDER: 'order',
  PURCHASE: 'purchase',
  SALE: 'sale',
  PRODUCT: 'product',
  RETURN: 'return',
  REPORT: 'report',
  INVENTORY: 'inventory',
};

export const getActionsAndSubjects = () => {
  return { ACTIONS, SUBJECTS };
}
