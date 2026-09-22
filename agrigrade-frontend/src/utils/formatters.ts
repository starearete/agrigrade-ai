export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatQuantity = (qty: number, unit: string = 'KG'): string => {
  return `${qty.toLocaleString('en-IN')} ${unit}`;
};

export const formatRemainingShelfLife = (days: number): string => {
  if (days <= 0) return 'Expired';
  if (days < 1) return 'Less than 1 day remaining';
  const rounded = Math.round(days * 10) / 10;
  return `${rounded} ${rounded === 1 ? 'day' : 'days'} remaining`;
};

export const formatNetRealization = (netAmount: number): string => {
  return formatCurrency(netAmount);
};

export const normalizeNumericInput = (value: string): string => {
  if (value === '' || value === '0' || value === '0.' || value.endsWith('.')) {
    return value;
  }
  if (/^0\d+/.test(value)) {
    return value.replace(/^0+/, '');
  }
  if (/^00+\./.test(value)) {
    return value.replace(/^0+/, '0');
  }
  return value;
};
