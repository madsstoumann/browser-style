export function findObjectByProperty(data, propertyName, propertyValue) {
  if (typeof data !== "object" || data === null) {
    return null; // Handle non-object or null data
  }

  if (data[propertyName] === propertyValue) {
    return data; // Base case: match found in current object
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findObjectByProperty(item, propertyName, propertyValue); // Recursive call on each item
      if (result) {
        return result;
      }
    }
  } else if (typeof data === "object") {
    for (const key in data) {
      const value = data[key];
      const result = findObjectByProperty(value, propertyName, propertyValue); // Recursive call on each value
      if (result) {
        return result;
      }
    }
  }

  return null; // Not found
}