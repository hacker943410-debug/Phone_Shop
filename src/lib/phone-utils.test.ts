import {
  formatPhoneNumber,
  normalizeMoneyInput,
  normalizePhoneNumber,
} from "@/lib/phone-utils";

describe("phone-utils", () => {
  it("normalizes phone numbers to digits only", () => {
    expect(normalizePhoneNumber("010-1234-5678")).toBe("01012345678");
  });

  it("formats mobile phone numbers with hyphens", () => {
    expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
  });

  it("normalizes money input to digits only", () => {
    expect(normalizeMoneyInput("1,280,000원")).toBe("1280000");
  });
});
