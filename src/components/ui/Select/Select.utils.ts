export const getValueByKeyOrPath = (
  obj: any,
  keyOrPath: string | number,
): any => {
  if (typeof keyOrPath === 'string' && keyOrPath.includes('.')) {
    return keyOrPath
      .split('.')
      .reduce((current: any, key: string) => current && current[key], obj);
  }
  return obj[keyOrPath as string];
};

export const getItemKey = (item: any, displayKey: string): string => {
  const explicitKey =
    getValueByKeyOrPath(item, 'id') ??
    getValueByKeyOrPath(item, 'value') ??
    getValueByKeyOrPath(item, displayKey);

  if (typeof explicitKey === 'string' || typeof explicitKey === 'number') {
    return String(explicitKey);
  }

  return String(getValueByKeyOrPath(item, displayKey));
};
