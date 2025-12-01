export const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters
  const cleanValue = value.replace(/[^\d,]/g, '');

  if (!cleanValue) return '';

  // Check if user is typing decimals
  const parts = cleanValue.split(',');

  // Format integer part with dots
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (parts.length > 1) {
    // If there is a comma, return integer part + comma + decimal part (max 2 digits)
    return `${integerPart},${parts[1].slice(0, 2)}`;
  }

  return integerPart;
};

export const parseCurrencyInput = (value: string): number => {
  // Remove dots and replace comma with dot for parsing
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue);
};

export const formatCurrencyDisplay = (amount: number): string => {
  return amount.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const formatCurrency = formatCurrencyDisplay;
