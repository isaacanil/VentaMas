export function buildClientBlock(d) {
  const name =
    !d.client?.name || d.client.name.toLowerCase() === 'generic client'
      ? 'Cliente Genérico'
      : d.client.name;

  const left = [{ text: `Cliente: ${name}`, style: 'headerInfo' }];
  if (d.client?.address && name !== 'Cliente Genérico')
    left.push({ text: `Dirección: ${d.client.address}`, style: 'headerInfo' });

  const right = [];
  if (d.client?.tel && name !== 'Cliente Genérico')
    right.push({ text: `Tel: ${d.client.tel}`, style: 'headerInfo' });
  if (d.client?.personalID && name !== 'Cliente Genérico')
    right.push({
      text: `RNC cliente: ${d.client.personalID}`,
      style: 'headerInfo',
    });

  if (!left.length && !right.length) return null;

  return {
    columns: [
      { width: '*', stack: left },
      { width: '*', stack: right },
    ],
  };
}
