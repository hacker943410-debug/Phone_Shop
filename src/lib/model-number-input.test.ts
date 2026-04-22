import { describe, expect, it } from "vitest";

import {
  countModelNumberCharactersBeforeCaret,
  formatModelNumberInput,
  resolveModelNumberCaretPosition,
} from "@/lib/model-number-input";

describe("model-number-input", () => {
  it("inserts a hyphen after two leading letters", () => {
    expect(formatModelNumberInput("sm009203912309")).toBe("SM-009203912309");
    expect(formatModelNumberInput("sm3028rkspew")).toBe("SM-3028RKSPEW");
    expect(formatModelNumberInput("SM")).toBe("SM-");
    expect(formatModelNumberInput("SM-S931N")).toBe("SM-S931N");
  });

  it("keeps non-two-letter prefixes intact", () => {
    expect(formatModelNumberInput("A3287")).toBe("A3287");
    expect(formatModelNumberInput("A3-287")).toBe("A3-287");
  });

  it("tracks caret position against the auto-inserted hyphen", () => {
    const formattedValue = formatModelNumberInput("SM009");
    const charactersBeforeCaret = countModelNumberCharactersBeforeCaret("SM0", 3);

    expect(formattedValue).toBe("SM-009");
    expect(resolveModelNumberCaretPosition(formattedValue, charactersBeforeCaret)).toBe(4);
  });
});
