export function extractCurrencyDigits(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const normalizedDigits = digits.replace(/^0+(?=\d)/, "");
  return normalizedDigits || "0";
}

export function formatCurrencyInputDisplay(digits: string) {
  if (!digits) {
    return "";
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function countDigitsBeforeCaret(value: string, caretPosition: number | null) {
  if (caretPosition === null || caretPosition <= 0) {
    return 0;
  }

  return value.slice(0, caretPosition).replace(/\D/g, "").length;
}

export function resolveCurrencyCaretPosition(
  formattedValue: string,
  digitsBeforeCaret: number,
) {
  if (!formattedValue || digitsBeforeCaret <= 0) {
    return 0;
  }

  let digitCount = 0;

  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) {
      digitCount += 1;

      if (digitCount >= digitsBeforeCaret) {
        return index + 1;
      }
    }
  }

  return formattedValue.length;
}
