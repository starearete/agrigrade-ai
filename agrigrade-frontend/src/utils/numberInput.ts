/**
 * Normalizes leading zeros in numeric input strings without breaking
 * in-progress typing states like "", "0", "0.", etc.
 */
export function normalizeLeadingZeros(val: string): string {
  if (!val || val.trim() === '') return '';
  const trimmed = val.trim();

  // Allow active decimal typing
  if (trimmed === '0' || trimmed === '0.') return trimmed;

  // If contains decimal point
  if (trimmed.includes('.')) {
    const [intPart, decPart] = trimmed.split('.');
    const normalizedInt = intPart.replace(/^0+(?=\d)/, '');
    const cleanInt = normalizedInt === '' ? '0' : normalizedInt;
    return `${cleanInt}.${decPart}`;
  }

  // Pure integer: strip leading zeros unless it's just '0'
  const normalized = trimmed.replace(/^0+(?=\d)/, '');
  return normalized === '' ? '0' : normalized;
}

export interface QuantityValidationResult {
  isValid: boolean;
  error?: string;
  parsedValue: number;
}

/**
 * Validates quantity string for farmer harvest or buyer order.
 * Ensures:
 * 1. Not empty and valid numeric
 * 2. Value > 0
 * 3. Max 3 decimal places (matching MySQL DECIMAL(12,3))
 * 4. Value <= maxAvailable (if maxAvailable is specified)
 */
export function validateQuantityInput(
  val: string,
  maxAvailable?: number,
  unit: string = 'KG'
): QuantityValidationResult {
  if (!val || val.trim() === '') {
    return {
      isValid: false,
      error: 'Quantity is required.',
      parsedValue: 0,
    };
  }

  const normalized = normalizeLeadingZeros(val);
  const num = parseFloat(normalized);

  if (isNaN(num) || !isFinite(num)) {
    return {
      isValid: false,
      error: 'Please enter a valid numeric quantity.',
      parsedValue: 0,
    };
  }

  if (num <= 0) {
    return {
      isValid: false,
      error: 'Quantity must be greater than 0.',
      parsedValue: num,
    };
  }

  // Check decimal places (max 3)
  if (normalized.includes('.')) {
    const decPart = normalized.split('.')[1] || '';
    if (decPart.length > 3) {
      return {
        isValid: false,
        error: 'Maximum 3 decimal places are allowed.',
        parsedValue: num,
      };
    }
  }

  // Check available inventory constraint (for buyers)
  if (maxAvailable !== undefined && num > maxAvailable) {
    return {
      isValid: false,
      error: `Only ${maxAvailable.toLocaleString()} ${unit} is currently available.`,
      parsedValue: num,
    };
  }

  return {
    isValid: true,
    parsedValue: num,
  };
}
