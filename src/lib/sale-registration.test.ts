import {
  buildSaleProductLabels,
  getAllowedWirelessProductCodes,
} from "@/lib/sale-registration";

describe("sale registration helpers", () => {
  it("limits wireless products by activation type", () => {
    expect(getAllowedWirelessProductCodes("DEVICE_CHANGE")).toEqual([
      "POSTPAID",
      "GENERAL",
    ]);
    expect(getAllowedWirelessProductCodes("NEW_SUBSCRIPTION")).toEqual([
      "POSTPAID",
      "PREPAID",
      "GENERAL",
      "USIM_ONLY",
      "USED_PHONE",
      "EGG",
    ]);
    expect(getAllowedWirelessProductCodes("NUMBER_PORT")).toEqual([
      "POSTPAID",
      "PREPAID",
      "GENERAL",
      "USIM_ONLY",
      "USED_PHONE",
    ]);
    expect(getAllowedWirelessProductCodes(null)).toEqual([]);
  });

  it("builds product label groups from selected flags", () => {
    expect(
      buildSaleProductLabels({
        wirelessPostpaidSelected: false,
        wirelessPrepaidSelected: false,
        wirelessGeneralSelected: false,
        wirelessUsimOnlySelected: false,
        wirelessUsedPhoneSelected: false,
        wirelessEggSelected: true,
        wiredInternetSelected: false,
        wiredTvSelected: true,
        wiredLandlineSelected: false,
        wiredInternetPhoneSelected: false,
        wiredBundleSelected: false,
        additionalDeviceOnlySelected: true,
      }),
    ).toEqual({
      wirelessProducts: ["5G/LTE Egg"],
      wiredProducts: ["TV"],
      additionalProducts: ["Device단독"],
    });
  });
});
