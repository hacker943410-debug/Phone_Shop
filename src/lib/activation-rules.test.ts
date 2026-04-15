import {
  formatActivationRuleLabel,
  getActivationEligibleDate,
  isActivationEligible,
} from "@/lib/activation-rules";
import { formatKstDate } from "@/lib/date-utils";

describe("activation rules", () => {
  it("calculates day-based eligible dates", () => {
    const eligibleDate = getActivationEligibleDate(
      new Date("2025-12-02T14:40:00+09:00"),
      {
        countUnit: "DAY",
        countValue: 127,
        monthCountMode: null,
      },
    );

    expect(formatKstDate(eligibleDate)).toBe("2026-04-08");
    expect(
      isActivationEligible(
        new Date("2026-04-15T09:00:00+09:00"),
        new Date("2025-12-02T14:40:00+09:00"),
        {
          countUnit: "DAY",
          countValue: 127,
          monthCountMode: null,
        },
      ),
    ).toBe(true);
  });

  it("calculates month-based eligible dates with current month included", () => {
    const eligibleDate = getActivationEligibleDate(
      new Date("2025-11-18T17:00:00+09:00"),
      {
        countUnit: "MONTH",
        countValue: 4,
        monthCountMode: "INCLUDE_CURRENT_MONTH",
      },
    );

    expect(formatKstDate(eligibleDate)).toBe("2026-03-01");
  });

  it("formats month-based rules with readable labels", () => {
    expect(
      formatActivationRuleLabel({
        countUnit: "MONTH",
        countValue: 6,
        monthCountMode: "EXCLUDE_CURRENT_MONTH",
      }),
    ).toBe("6개월 / 당월 미포함");
  });
});
