export {
  formatDate,
  getDiscount,
  getProductIndividualDiscount,
  getProductsIndividualDiscounts,
  hasIndividualDiscounts,
} from '@/pdf/invoicesAndQuotation/utils/formatters';

export function money(value: number | string | null | undefined): string {
  return Number(value).toFixed(2);
}
