import { format as formatDateFns } from 'date-fns'

export function money(n) {
  return Number(n).toFixed(2)
}

export function formatDate(ts) {
  const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
  return formatDateFns(date, 'dd/MM/yyyy')
}

export function getDiscount(d) {
  const products = Array.isArray(d?.products) ? d.products : []
  const discountValue = Number(d?.discount?.value) || 0

  if (!discountValue || products.length === 0) return 0

  const subtotal = products.reduce((sum, p) => {
    const price = Number(p?.pricing?.price) || 0
    const qty = Number(p?.amountToBuy) || 0
    return sum + price * qty
  }, 0)

  return subtotal * (discountValue / 100)
}
