const numberFormatter = new Intl.NumberFormat('es-ES')

export const formatLots = (value) => {
  if (!Number.isFinite(value)) return '0 lotes'
  const count = numberFormatter.format(value)
  return `${count} ${value === 1 ? 'lote' : 'lotes'}`
}

export const formatUnits = (value) => {
  if (!Number.isFinite(value)) return null
  const count = numberFormatter.format(value)
  return `${count} ${value === 1 ? 'und.' : 'unds.'}`
}
