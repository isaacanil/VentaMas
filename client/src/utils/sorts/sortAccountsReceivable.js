
export const sortAccounts = (accounts, sortCriteria, sortDirection) => {
  if (sortCriteria === 'defaultCriteria') return accounts;

  return [...accounts].sort((a, b) => {
    let aValue, bValue;

    switch (sortCriteria) {
      case 'date':
        aValue = a.date?.seconds || 0;
        bValue = b.date?.seconds || 0;
        break;
      case 'invoiceNumber':
        aValue = a.invoiceNumber || 0;
        bValue = b.invoiceNumber || 0;
        break;
      case 'client':
        aValue = a.client || '';
        bValue = b.client || '';
        break;
      case 'balance':
        aValue = a.balance || 0;
        bValue = b.balance || 0;
        break;
      case 'initialAmount':
        aValue = a.initialAmount || 0;
        bValue = b.initialAmount || 0;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return sortDirection === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });
};