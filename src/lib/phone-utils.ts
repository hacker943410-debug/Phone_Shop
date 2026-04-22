export function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizePhoneNumber(value: string) {
  return normalizeDigits(value);
}

export function normalizeMoneyInput(value: string) {
  return normalizeDigits(value);
}

export function formatPhoneNumber(value: string) {
  const digits = normalizePhoneNumber(value);

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 9 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }

  return digits;
}
