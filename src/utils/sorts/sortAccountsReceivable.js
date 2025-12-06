export const sortAccounts = (accounts, criteria, direction) => {
  const sortedAccounts = [...accounts];

  switch (criteria) {
    case 'defaultCriteria':
      // No ordenar, usar el orden por defecto
      return sortedAccounts;
    case 'date':
      sortedAccounts.sort((a, b) => {
        const dateA = a.date?.seconds || 0;
        const dateB = b.date?.seconds || 0;

        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      });
      break;
    case 'invoiceNumber':
      sortedAccounts.sort((a, b) => {
        const numA = Number(a.invoiceNumber.replace(/\D/g, '')) || 0;
        const numB = Number(b.invoiceNumber.replace(/\D/g, '')) || 0;

        return direction === 'asc' ? numA - numB : numB - numA;
      });
      break;
    case 'client':
      sortedAccounts.sort((a, b) => {
        const clientA = a.client?.toUpperCase() || '';
        const clientB = b.client?.toUpperCase() || '';

        if (direction === 'asc') {
          return clientA.localeCompare(clientB);
        } else {
          return clientB.localeCompare(clientA);
        }
      });
      break;
    case 'insurance':
      sortedAccounts.sort((a, b) => {
        const insuranceA = a.insurance?.toUpperCase() || 'Z'; // Para que N/A quede al final
        const insuranceB = b.insurance?.toUpperCase() || 'Z';

        if (direction === 'asc') {
          return insuranceA.localeCompare(insuranceB);
        } else {
          return insuranceB.localeCompare(insuranceA);
        }
      });
      break;
    case 'balance':
      sortedAccounts.sort((a, b) => {
        const balanceA = a.balance || 0;
        const balanceB = b.balance || 0;

        return direction === 'asc' ? balanceA - balanceB : balanceB - balanceA;
      });
      break;
    case 'initialAmount':
      sortedAccounts.sort((a, b) => {
        const amountA = a.initialAmount || 0;
        const amountB = b.initialAmount || 0;

        return direction === 'asc' ? amountA - amountB : amountB - amountA;
      });
      break;
    default:
      break;
  }

  return sortedAccounts;
};
