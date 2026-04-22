function sanitizeModelNumberInput(value: string) {
  return value.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");
}

export function formatModelNumberInput(value: string) {
  const sanitized = sanitizeModelNumberInput(value);

  if (!sanitized) {
    return "";
  }

  if (sanitized === "-") {
    return "-";
  }

  const compactValue = sanitized.replace(/-/g, "");

  if (/^[A-Z]{2}[A-Z0-9]*$/.test(compactValue)) {
    return `${compactValue.slice(0, 2)}-${compactValue.slice(2)}`;
  }

  return sanitized;
}

export function countModelNumberCharactersBeforeCaret(
  value: string,
  caretPosition: number | null,
) {
  if (caretPosition === null || caretPosition <= 0) {
    return 0;
  }

  return value
    .slice(0, caretPosition)
    .replace(/[^A-Z0-9]/gi, "").length;
}

export function resolveModelNumberCaretPosition(
  formattedValue: string,
  charactersBeforeCaret: number,
) {
  if (!formattedValue || charactersBeforeCaret <= 0) {
    return 0;
  }

  let characterCount = 0;

  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/[A-Z0-9]/i.test(formattedValue[index])) {
      characterCount += 1;

      if (characterCount >= charactersBeforeCaret) {
        return index + 1;
      }
    }
  }

  return formattedValue.length;
}
