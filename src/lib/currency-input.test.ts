import { describe, expect, it } from "vitest";

import {
  countDigitsBeforeCaret,
  extractCurrencyDigits,
  formatCurrencyInputDisplay,
  resolveCurrencyCaretPosition,
} from "@/lib/currency-input";

describe("currency input helpers", () => {
  it("extracts digits from formatted currency text", () => {
    expect(extractCurrencyDigits("12,345원")).toBe("12345");
    expect(extractCurrencyDigits("0012345")).toBe("12345");
    expect(extractCurrencyDigits("")).toBe("");
  });

  it("formats digit strings with comma separators", () => {
    expect(formatCurrencyInputDisplay("")).toBe("");
    expect(formatCurrencyInputDisplay("1")).toBe("1");
    expect(formatCurrencyInputDisplay("12345")).toBe("12,345");
    expect(formatCurrencyInputDisplay("123456789")).toBe("123,456,789");
  });

  it("keeps caret aligned with the same digit after formatting", () => {
    const digitsBeforeCaret = countDigitsBeforeCaret("12345", 3);
    const caretPosition = resolveCurrencyCaretPosition("12,345", digitsBeforeCaret);

    expect(digitsBeforeCaret).toBe(3);
    expect(caretPosition).toBe(4);
  });

  it("moves caret to the end when digits are deleted", () => {
    const digitsBeforeCaret = countDigitsBeforeCaret("12,345", 5);
    const caretPosition = resolveCurrencyCaretPosition("1,245", digitsBeforeCaret);

    expect(digitsBeforeCaret).toBe(4);
    expect(caretPosition).toBe(5);
  });
});
