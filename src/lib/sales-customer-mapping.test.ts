import { describe, expect, it } from "vitest";

import type {
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
} from "@/components/workspace/sales-types";

import { resolveCustomerMappedSelection } from "./sales-customer-mapping";

const carriers: SalesCarrierRecord[] = [
  {
    id: "carrier-skt",
    name: "SKT",
    code: "SKT",
    ratePlans: [
      {
        id: "rate-skt-premium",
        name: "5GX Premium",
        monthlyFee: 109000,
        voiceCallMinutes: 999999,
        videoCallMinutes: 300,
        dataAllowanceGb: 250,
        usageCount: 5,
      },
      {
        id: "rate-skt-basic",
        name: "5GX Basic",
        monthlyFee: 89000,
        voiceCallMinutes: 600,
        videoCallMinutes: 100,
        dataAllowanceGb: 50,
        usageCount: 3,
      },
    ],
    addOnServices: [
      { id: "svc-shared-vm", name: "공통 / V컬러링", monthlyFee: 3300, scope: "shared", usageCount: 4 },
      { id: "svc-skt-insurance", name: "분실보험", monthlyFee: 5500, scope: "carrier", usageCount: 2 },
    ],
  },
  {
    id: "carrier-kt",
    name: "KT",
    code: "KT",
    ratePlans: [
      {
        id: "rate-kt-5g",
        name: "5G 초이스",
        monthlyFee: 90000,
        voiceCallMinutes: 999999,
        videoCallMinutes: 300,
        dataAllowanceGb: 110,
        usageCount: 2,
      },
    ],
    addOnServices: [],
  },
];

const availableInventory: SalesAvailableInventoryRecord[] = [
  {
    id: "inventory-s25-skt",
    carrierId: "carrier-skt",
    carrierName: "SKT",
    deviceModelId: "device-s25",
    deviceModelName: "Galaxy S25",
    storeName: "본점",
    color: "Titan Gray",
    capacity: "256GB",
    imei: "111111111111111",
    costAmount: 900000,
    receivedAt: "2026-04-18T00:00:00.000Z",
  },
  {
    id: "inventory-iphone-skt",
    carrierId: "carrier-skt",
    carrierName: "SKT",
    deviceModelId: "device-iphone16",
    deviceModelName: "iPhone 16",
    storeName: "본점",
    color: "Black",
    capacity: "128GB",
    imei: "222222222222222",
    costAmount: 1000000,
    receivedAt: "2026-04-18T00:00:00.000Z",
  },
];

function buildCustomer(overrides: Partial<SalesCustomerRecord>): SalesCustomerRecord {
  return {
    id: "customer-1",
    name: "김서현",
    phone: "010-1111-2222",
    currentCarrierId: "carrier-skt",
    currentCarrierName: "SKT",
    retentionDisplay: "+90일 / 2026-07-01까지",
    retentionRemainingDays: 45,
    latestSaleDeviceModelId: "device-s25",
    latestSaleRatePlanId: "rate-skt-premium",
    latestSaleAddOnServiceIds: ["svc-shared-vm", "svc-skt-insurance"],
    ...overrides,
  };
}

describe("resolveCustomerMappedSelection", () => {
  it("maps inventory, rate plan, and add-on services from the customer's latest sale", () => {
    const result = resolveCustomerMappedSelection({
      customer: buildCustomer({}),
      currentInventoryItemId: "",
      availableInventory,
      carriers,
    });

    expect(result).toEqual({
      inventoryItemId: "inventory-s25-skt",
      ratePlanId: "rate-skt-premium",
      selectedAddOnServiceIds: ["svc-shared-vm", "svc-skt-insurance"],
    });
  });

  it("falls back to the current compatible inventory when the sold device is not in stock", () => {
    const result = resolveCustomerMappedSelection({
      customer: buildCustomer({ latestSaleDeviceModelId: "device-missing" }),
      currentInventoryItemId: "inventory-iphone-skt",
      availableInventory,
      carriers,
    });

    expect(result).toEqual({
      inventoryItemId: "inventory-iphone-skt",
      ratePlanId: "rate-skt-premium",
      selectedAddOnServiceIds: ["svc-shared-vm", "svc-skt-insurance"],
    });
  });

  it("returns null when the customer has no active carrier information", () => {
    const result = resolveCustomerMappedSelection({
      customer: buildCustomer({
        currentCarrierId: null,
        currentCarrierName: null,
        latestSaleDeviceModelId: null,
        latestSaleRatePlanId: null,
        latestSaleAddOnServiceIds: [],
      }),
      currentInventoryItemId: "",
      availableInventory,
      carriers,
    });

    expect(result).toBeNull();
  });
});
