import { fireEvent, render, screen } from "@testing-library/react";

import { SalesLauncher } from "@/components/workspace/sales-launcher";
import type {
  SalesAgencyRecord,
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
} from "@/components/workspace/sales-types";

vi.mock("@/app/actions/sales", () => ({
  createSaleAction: vi.fn(),
}));

vi.mock("@/components/workspace/customer-upsert-dialog", () => ({
  CustomerUpsertDialog: () => null,
}));

const customers: SalesCustomerRecord[] = [
  {
    id: "customer-kim",
    name: "김서진",
    phone: "010-1111-2222",
    currentCarrierId: "carrier-skt",
    currentCarrierName: "SKT",
    retentionDisplay: null,
    retentionRemainingDays: null,
    latestSaleDeviceModelId: null,
    latestSaleRatePlanId: null,
    latestSaleAddOnServiceIds: [],
  },
];

const carriers: SalesCarrierRecord[] = [
  {
    id: "carrier-skt",
    name: "SKT",
    code: "SKT",
    ratePlans: [
      {
        id: "plan-5g",
        name: "5G 베이직",
        monthlyFee: 55000,
        voiceCallMinutes: null,
        videoCallMinutes: null,
        dataAllowanceGb: 24,
        usageCount: 0,
      },
    ],
    addOnServices: [],
  },
];

const salesAgencies: SalesAgencyRecord[] = [
  {
    id: "agency-main",
    name: "본사 대리점",
  },
];

const availableInventory: SalesAvailableInventoryRecord[] = [
  {
    id: "inventory-s25",
    carrierId: "carrier-skt",
    carrierName: "SKT",
    deviceModelId: "model-s25",
    deviceModelName: "Galaxy S25",
    storeName: "본점",
    color: "Silver",
    capacity: "256GB",
    serialNumber: "SN-S25-001",
    modelNumber: "SM-S931N",
    costAmount: 900000,
    receivedAt: "2026-04-20",
  },
];

describe("SalesLauncher", () => {
  it("opens the sales wizard without showing the global sales form error modal", () => {
    render(
      <SalesLauncher
        availableInventory={availableInventory}
        carriers={carriers}
        currentUserId="user-admin"
        currentUserName="관리자"
        customers={customers}
        defaultSaleDate="2026-04-22"
        discountPolicies={[]}
        salesAgencies={salesAgencies}
        saleProfitPolicies={[]}
        staffCommissionPolicies={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "판매 등록" }));

    expect(
      screen.getByRole("heading", { name: "판매 등록" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "판매 입력 값을 확인해 주세요" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("기존 고객 또는 신규 고객을 선택해 주세요")).toBeInTheDocument();
  });
});
