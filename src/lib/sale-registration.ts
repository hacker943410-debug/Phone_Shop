export type SaleCustomerEntryType = "EXISTING" | "NEW";
export type SaleActivationType =
  | "DEVICE_CHANGE"
  | "NEW_SUBSCRIPTION"
  | "NUMBER_PORT";
export type WirelessProductCode =
  | "POSTPAID"
  | "PREPAID"
  | "GENERAL"
  | "USIM_ONLY"
  | "USED_PHONE"
  | "EGG";
export type WiredProductCode =
  | "INTERNET"
  | "TV"
  | "LANDLINE"
  | "INTERNET_PHONE"
  | "BUNDLE";
export type AdditionalProductCode = "DEVICE_ONLY";

export const wirelessProductDefinitions: Array<{
  code: WirelessProductCode;
  label: string;
}> = [
  { code: "POSTPAID", label: "후불" },
  { code: "PREPAID", label: "선불" },
  { code: "GENERAL", label: "일반" },
  { code: "USIM_ONLY", label: "유심단독" },
  { code: "USED_PHONE", label: "중고폰" },
  { code: "EGG", label: "5G/LTE Egg" },
];

export const wiredProductDefinitions: Array<{
  code: WiredProductCode;
  label: string;
}> = [
  { code: "INTERNET", label: "인터넷" },
  { code: "TV", label: "TV" },
  { code: "LANDLINE", label: "일반전화" },
  { code: "INTERNET_PHONE", label: "인터넷전화" },
  { code: "BUNDLE", label: "결합" },
];

export const additionalProductDefinitions: Array<{
  code: AdditionalProductCode;
  label: string;
}> = [{ code: "DEVICE_ONLY", label: "Device단독" }];

const allowedWirelessProductMap: Record<SaleActivationType, WirelessProductCode[]> = {
  DEVICE_CHANGE: ["POSTPAID", "GENERAL"],
  NEW_SUBSCRIPTION: [
    "POSTPAID",
    "PREPAID",
    "GENERAL",
    "USIM_ONLY",
    "USED_PHONE",
    "EGG",
  ],
  NUMBER_PORT: ["POSTPAID", "PREPAID", "GENERAL", "USIM_ONLY", "USED_PHONE"],
};

export function getSaleCustomerEntryTypeLabel(value: SaleCustomerEntryType) {
  return value === "EXISTING" ? "기존 고객" : "신규 고객";
}

export function getSaleActivationTypeLabel(value: SaleActivationType) {
  switch (value) {
    case "DEVICE_CHANGE":
      return "기기변경";
    case "NEW_SUBSCRIPTION":
      return "신규가입";
    case "NUMBER_PORT":
      return "번호이동";
  }
}

export function getAllowedWirelessProductCodes(
  value: SaleActivationType | null | undefined,
) {
  if (!value) {
    return [];
  }

  return allowedWirelessProductMap[value];
}

export function getWirelessProductLabel(value: WirelessProductCode) {
  return (
    wirelessProductDefinitions.find((definition) => definition.code === value)?.label ??
    value
  );
}

export function getWiredProductLabel(value: WiredProductCode) {
  return (
    wiredProductDefinitions.find((definition) => definition.code === value)?.label ??
    value
  );
}

export function getAdditionalProductLabel(value: AdditionalProductCode) {
  return (
    additionalProductDefinitions.find((definition) => definition.code === value)?.label ??
    value
  );
}

export function buildSaleProductLabels(input: {
  wirelessPostpaidSelected: boolean;
  wirelessPrepaidSelected: boolean;
  wirelessGeneralSelected: boolean;
  wirelessUsimOnlySelected: boolean;
  wirelessUsedPhoneSelected: boolean;
  wirelessEggSelected: boolean;
  wiredInternetSelected: boolean;
  wiredTvSelected: boolean;
  wiredLandlineSelected: boolean;
  wiredInternetPhoneSelected: boolean;
  wiredBundleSelected: boolean;
  additionalDeviceOnlySelected: boolean;
}) {
  const wirelessProducts: string[] = [];
  const wiredProducts: string[] = [];
  const additionalProducts: string[] = [];

  if (input.wirelessPostpaidSelected) {
    wirelessProducts.push(getWirelessProductLabel("POSTPAID"));
  }

  if (input.wirelessPrepaidSelected) {
    wirelessProducts.push(getWirelessProductLabel("PREPAID"));
  }

  if (input.wirelessGeneralSelected) {
    wirelessProducts.push(getWirelessProductLabel("GENERAL"));
  }

  if (input.wirelessUsimOnlySelected) {
    wirelessProducts.push(getWirelessProductLabel("USIM_ONLY"));
  }

  if (input.wirelessUsedPhoneSelected) {
    wirelessProducts.push(getWirelessProductLabel("USED_PHONE"));
  }

  if (input.wirelessEggSelected) {
    wirelessProducts.push(getWirelessProductLabel("EGG"));
  }

  if (input.wiredInternetSelected) {
    wiredProducts.push(getWiredProductLabel("INTERNET"));
  }

  if (input.wiredTvSelected) {
    wiredProducts.push(getWiredProductLabel("TV"));
  }

  if (input.wiredLandlineSelected) {
    wiredProducts.push(getWiredProductLabel("LANDLINE"));
  }

  if (input.wiredInternetPhoneSelected) {
    wiredProducts.push(getWiredProductLabel("INTERNET_PHONE"));
  }

  if (input.wiredBundleSelected) {
    wiredProducts.push(getWiredProductLabel("BUNDLE"));
  }

  if (input.additionalDeviceOnlySelected) {
    additionalProducts.push(getAdditionalProductLabel("DEVICE_ONLY"));
  }

  return {
    wirelessProducts,
    wiredProducts,
    additionalProducts,
  };
}

