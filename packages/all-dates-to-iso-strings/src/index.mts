export function convertArrayDatesToStrings(arr: unknown[]): unknown[] {
  const convertedArray: unknown[] = [];

  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    if (element instanceof Date) {
      convertedArray.push(element.toISOString());
    } else if (Array.isArray(element)) {
      convertedArray.push(convertArrayDatesToStrings(element));
    } else if (typeof element === 'object' && element !== null) {
      convertedArray.push(
        convertObjectDatesToStrings(element as Record<string, unknown>),
      );
    } else {
      convertedArray.push(element);
    }
  }

  return convertedArray;
}

export function convertObjectDatesToStrings(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const converted: Record<string, unknown> = { ...obj };

  for (const key in obj) {
    const value = obj[key];
    if (value instanceof Date) {
      converted[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      converted[key] = convertArrayDatesToStrings(value);
    } else if (typeof value === 'object' && value !== null) {
      // Since null is type object, have to check it is not null.
      // Impossible to tell if it is a Record<string, unknown>, but it probably will be, so cast it.
      converted[key] = convertObjectDatesToStrings(
        value as Record<string, unknown>,
      );
    }
  }

  return converted;
}
