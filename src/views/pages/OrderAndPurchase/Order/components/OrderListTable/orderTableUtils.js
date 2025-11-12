import { DateTime } from 'luxon';

export const calculatePaymentDate = (createdAt, conditionId) => {
  if (!createdAt) return null;

  let daysToAdd = 0;
  switch (conditionId) {
    case 'cash':
      daysToAdd = 0;
      break;
    case 'one_week':
      daysToAdd = 7;
      break;
    case 'fifteen_days':
      daysToAdd = 15;
      break;
    case 'thirty_days':
      daysToAdd = 30;
      break;
    case 'other':
      daysToAdd = 0;
      break;
    default:
      break;
  }

  const paymentDate = DateTime.fromMillis(createdAt).plus({ days: daysToAdd });
  return paymentDate.toMillis();
};

export const calculateTotalNewStockFromReplenishments = (replenishments) => {
  let totalQuantity = 0;
  if (Array.isArray(replenishments)) {
    replenishments.forEach((item) => {
      if (typeof item.quantity === 'number') {
        totalQuantity += item.quantity;
      }
    });
  }
  return totalQuantity;
};
