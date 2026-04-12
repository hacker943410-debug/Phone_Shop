import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/client/client";
import {
  DiscountMethod,
  DiscountTarget,
  InventoryStatus,
  PaymentMethod,
  ReceivableStatus,
  RevenueCalculationMethod,
  SaleStatus,
  UserRole,
} from "./generated/client/enums";
import { hashPassword } from "../src/lib/auth/password";

const adapter = new PrismaBetterSqlite3(
  { url: process.env.DATABASE_URL || "file:./prisma/dev.db" },
  { timestampFormat: "unixepoch-ms" },
);

const prisma = new PrismaClient({ adapter });

function at(dateTime: string) {
  return new Date(dateTime);
}

async function main() {
  await prisma.$transaction([
    prisma.saleAddOnService.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.receivable.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.discountPolicy.deleteMany(),
    prisma.saleProfitPolicy.deleteMany(),
    prisma.rebatePolicy.deleteMany(),
    prisma.addOnService.deleteMany(),
    prisma.ratePlan.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.deviceModel.deleteMany(),
    prisma.carrier.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  await prisma.user.createMany({
    data: [
      {
        id: "user-admin",
        username: "admin",
        displayName: "관리자",
        passwordHash: hashPassword("admin1234!"),
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        id: "user-kim-jh",
        username: "jihu_kim",
        displayName: "김지훈",
        passwordHash: hashPassword("staff1234!"),
        role: UserRole.STAFF,
        isActive: true,
      },
      {
        id: "user-park-sy",
        username: "sunyoung_park",
        displayName: "박선영",
        passwordHash: hashPassword("staff1234!"),
        role: UserRole.STAFF,
        isActive: true,
      },
      {
        id: "user-lee-dy",
        username: "doyoon_lee",
        displayName: "이도윤",
        passwordHash: hashPassword("staff1234!"),
        role: UserRole.STAFF,
        isActive: true,
      },
    ],
  });

  await prisma.carrier.createMany({
    data: [
      { id: "carrier-skt", code: "SKT", name: "SKT", isActive: true },
      { id: "carrier-kt", code: "KT", name: "KT", isActive: true },
      { id: "carrier-lgu", code: "LGU", name: "LG U+", isActive: true },
    ],
  });

  await prisma.deviceModel.createMany({
    data: [
      {
        id: "device-galaxy-s25",
        name: "Galaxy S25",
        manufacturer: "Samsung",
        isActive: true,
      },
      {
        id: "device-iphone-16",
        name: "iPhone 16",
        manufacturer: "Apple",
        isActive: true,
      },
      {
        id: "device-z-flip-6",
        name: "Galaxy Z Flip 6",
        manufacturer: "Samsung",
        isActive: true,
      },
      {
        id: "device-galaxy-a56",
        name: "Galaxy A56",
        manufacturer: "Samsung",
        isActive: true,
      },
    ],
  });

  await prisma.ratePlan.createMany({
    data: [
      {
        id: "plan-skt-5gx",
        carrierId: "carrier-skt",
        name: "5GX 플래티넘",
        monthlyFee: 109000,
        description: "SKT 프리미엄 5G 요금제",
        isActive: true,
      },
      {
        id: "plan-kt-choice",
        carrierId: "carrier-kt",
        name: "5G 초이스 베이직",
        monthlyFee: 90000,
        description: "KT 대표 5G 요금제",
        isActive: true,
      },
      {
        id: "plan-lgu-premier",
        carrierId: "carrier-lgu",
        name: "5G 프리미어 에센셜",
        monthlyFee: 95000,
        description: "LG U+ 고빈도 판매 요금제",
        isActive: true,
      },
    ],
  });

  await prisma.addOnService.createMany({
    data: [
      {
        id: "service-kt-insurance",
        carrierId: "carrier-kt",
        name: "KT 폰 안심보험",
        monthlyFee: 7900,
        description: "파손/분실 기본 보장",
        isActive: true,
      },
      {
        id: "service-skt-combine",
        carrierId: "carrier-skt",
        name: "가족 결합 할인",
        monthlyFee: 0,
        description: "결합 할인용 선택 항목",
        isActive: true,
      },
      {
        id: "service-lgu-cloud",
        carrierId: "carrier-lgu",
        name: "클라우드 백업",
        monthlyFee: 3300,
        description: "기본 부가서비스 예시",
        isActive: true,
      },
    ],
  });

  await prisma.rebatePolicy.createMany({
    data: [
      {
        id: "rebate-kt-iphone16-20260411",
        name: "KT iPhone 16 리베이트",
        carrierId: "carrier-kt",
        deviceModelId: "device-iphone-16",
        startsAt: at("2026-04-11T00:00:00+09:00"),
        endsAt: at("2026-04-11T23:59:59+09:00"),
        defaultRebateAmount: 310000,
        memo: "하루 특가 리베이트",
        isActive: true,
      },
      {
        id: "rebate-lgu-zflip6-20260401",
        name: "LG U+ Z Flip 6 리베이트",
        carrierId: "carrier-lgu",
        deviceModelId: "device-z-flip-6",
        startsAt: at("2026-04-01T00:00:00+09:00"),
        endsAt: at("2026-04-30T23:59:59+09:00"),
        defaultRebateAmount: 420000,
        memo: "4월 월간 리베이트",
        isActive: true,
      },
    ],
  });

  await prisma.saleProfitPolicy.createMany({
    data: [
      {
        id: "profit-skt-default-202604",
        name: "SKT 판매수익 기본 정책",
        carrierId: "carrier-skt",
        startsAt: at("2026-04-01T00:00:00+09:00"),
        endsAt: at("2026-04-30T23:59:59+09:00"),
        calculationMethod: RevenueCalculationMethod.PERCENTAGE,
        calculationValue: 5,
        memo: "판매금액 x 5%",
        isActive: true,
      },
      {
        id: "profit-kt-fixed-202604",
        name: "KT 판매수익 정액 정책",
        carrierId: "carrier-kt",
        startsAt: at("2026-04-01T00:00:00+09:00"),
        endsAt: at("2026-04-30T23:59:59+09:00"),
        calculationMethod: RevenueCalculationMethod.FIXED_AMOUNT,
        calculationValue: 70000,
        memo: "KT 주력 판매 정액 수익",
        isActive: true,
      },
      {
        id: "profit-lgu-flip-202604",
        name: "LG U+ 플립6 고정 수익 정책",
        carrierId: "carrier-lgu",
        startsAt: at("2026-04-01T00:00:00+09:00"),
        endsAt: at("2026-04-30T23:59:59+09:00"),
        calculationMethod: RevenueCalculationMethod.FIXED_AMOUNT,
        calculationValue: 120000,
        memo: "플립6 집중 판매 기간",
        isActive: true,
      },
    ],
  });

  await prisma.discountPolicy.createMany({
    data: [
      {
        id: "discount-device-s25-202604",
        name: "갤럭시 S25 단말기 할인",
        target: DiscountTarget.DEVICE,
        deviceModelId: "device-galaxy-s25",
        startsAt: at("2026-04-11T00:00:00+09:00"),
        endsAt: at("2026-04-20T23:59:59+09:00"),
        discountMethod: DiscountMethod.PERCENTAGE,
        discountValue: 8,
        memo: "단말기 우선 할인",
        isActive: true,
      },
      {
        id: "discount-carrier-skt-202604",
        name: "SKT 통신사 할인율",
        target: DiscountTarget.CARRIER,
        carrierId: "carrier-skt",
        startsAt: at("2026-04-01T00:00:00+09:00"),
        endsAt: at("2026-04-30T23:59:59+09:00"),
        discountMethod: DiscountMethod.PERCENTAGE,
        discountValue: 5,
        memo: "기본 통신사 할인율",
        isActive: true,
      },
      {
        id: "discount-kt-iphone16-202604",
        name: "KT iPhone 16 단말기 할인",
        target: DiscountTarget.DEVICE,
        carrierId: "carrier-kt",
        deviceModelId: "device-iphone-16",
        startsAt: at("2026-04-01T00:00:00+09:00"),
        endsAt: at("2026-04-30T23:59:59+09:00"),
        discountMethod: DiscountMethod.PERCENTAGE,
        discountValue: 8,
        memo: "KT 주력 단말 할인",
        isActive: true,
      },
    ],
  });

  await prisma.customer.createMany({
    data: [
      {
        id: "customer-kim-seohyun",
        name: "김서현",
        phone: "010-2458-1123",
        normalizedPhone: "01024581123",
        currentCarrierId: "carrier-kt",
      },
      {
        id: "customer-lee-jaemin",
        name: "이재민",
        phone: "010-9034-1120",
        normalizedPhone: "01090341120",
        currentCarrierId: "carrier-skt",
      },
      {
        id: "customer-jung-haeun",
        name: "정하은",
        phone: "010-5612-4430",
        normalizedPhone: "01056124430",
        currentCarrierId: "carrier-lgu",
      },
      {
        id: "customer-oh-sion",
        name: "오시온",
        phone: "010-7784-3312",
        normalizedPhone: "01077843312",
        currentCarrierId: "carrier-skt",
      },
      {
        id: "customer-choi-minwoo",
        name: "최민우",
        phone: "010-9924-7781",
        normalizedPhone: "01099247781",
        currentCarrierId: "carrier-skt",
      },
    ],
  });

  await prisma.inventoryItem.createMany({
    data: [
      {
        id: "inventory-s25-001",
        carrierId: "carrier-skt",
        deviceModelId: "device-galaxy-s25",
        color: "Titan Gray",
        capacity: "256GB",
        imei: "357000001245871",
        costAmount: 912000,
        status: InventoryStatus.IN_STOCK,
        receivedAt: at("2026-04-10T10:00:00+09:00"),
        assigneeId: "user-kim-jh",
      },
      {
        id: "inventory-iphone16-001",
        carrierId: "carrier-kt",
        deviceModelId: "device-iphone-16",
        color: "Blue",
        capacity: "128GB",
        imei: "356100001245654",
        costAmount: 1045000,
        status: InventoryStatus.SOLD,
        receivedAt: at("2026-04-09T11:00:00+09:00"),
        dispatchedAt: at("2026-04-11T13:20:00+09:00"),
        assigneeId: "user-park-sy",
      },
      {
        id: "inventory-iphone16-002",
        carrierId: "carrier-kt",
        deviceModelId: "device-iphone-16",
        color: "Blue",
        capacity: "128GB",
        imei: "356100001245655",
        costAmount: 1045000,
        status: InventoryStatus.RESERVED,
        receivedAt: at("2026-04-10T15:00:00+09:00"),
        assigneeId: "user-park-sy",
      },
      {
        id: "inventory-zflip6-001",
        carrierId: "carrier-lgu",
        deviceModelId: "device-z-flip-6",
        color: "Mint",
        capacity: "512GB",
        imei: "358200001245338",
        costAmount: 1180000,
        status: InventoryStatus.SOLD,
        receivedAt: at("2026-04-07T14:10:00+09:00"),
        dispatchedAt: at("2026-04-09T16:15:00+09:00"),
        assigneeId: "user-lee-dy",
      },
      {
        id: "inventory-a56-001",
        carrierId: "carrier-skt",
        deviceModelId: "device-galaxy-a56",
        color: "Awesome Navy",
        capacity: "256GB",
        imei: "359300001245118",
        costAmount: 620000,
        status: InventoryStatus.SOLD,
        receivedAt: at("2026-04-06T09:30:00+09:00"),
        dispatchedAt: at("2026-04-08T18:40:00+09:00"),
        assigneeId: "user-kim-jh",
      },
    ],
  });

  await prisma.sale.createMany({
    data: [
      {
        id: "sale-20260411-kim",
        saleDate: at("2026-04-11T13:20:00+09:00"),
        status: SaleStatus.COMPLETED,
        customerId: "customer-kim-seohyun",
        staffId: "user-park-sy",
        carrierId: "carrier-kt",
        ratePlanId: "plan-kt-choice",
        inventoryItemId: "inventory-iphone16-001",
        deviceModelId: "device-iphone-16",
        listPrice: 1400000,
        discountApplied: true,
        discountMethod: DiscountMethod.PERCENTAGE,
        discountValue: 8,
        discountSuggestionMethod: DiscountMethod.PERCENTAGE,
        discountSuggestionValue: 8,
        discountAmount: 112000,
        discountedPrice: 1288000,
        subsidyAmount: 0,
        finalSalePrice: 1288000,
        cashAmount: 200000,
        cardAmount: 788000,
        bankTransferAmount: 0,
        cardInstallmentMonths: 12,
        actualReceivedAmount: 988000,
        receivableAmount: 300000,
        deviceCostAmount: 1045000,
        rebateAmount: 310000,
        policyRevenueAmount: 70000,
        profitCalculationBaseAmount: 1288000,
        profitDeductionAmount: 0,
        totalProfitAmount: 380000,
        appliedRebatePolicyId: "rebate-kt-iphone16-20260411",
        appliedSaleProfitPolicyId: "profit-kt-fixed-202604",
        appliedDiscountPolicyId: "discount-kt-iphone16-202604",
        appliedRebatePolicyName: "KT iPhone 16 리베이트",
        appliedSaleProfitPolicyName: "KT 판매수익 정액 정책",
        appliedDiscountPolicyName: "KT iPhone 16 단말기 할인",
      },
      {
        id: "sale-20260411-lee",
        saleDate: at("2026-04-11T15:10:00+09:00"),
        status: SaleStatus.COMPLETED,
        customerId: "customer-lee-jaemin",
        staffId: "user-kim-jh",
        carrierId: "carrier-skt",
        ratePlanId: "plan-skt-5gx",
        inventoryItemId: "inventory-s25-001",
        deviceModelId: "device-galaxy-s25",
        listPrice: 1200000,
        discountApplied: true,
        discountMethod: DiscountMethod.PERCENTAGE,
        discountValue: 5,
        discountSuggestionMethod: DiscountMethod.PERCENTAGE,
        discountSuggestionValue: 8,
        discountAmount: 60000,
        discountedPrice: 1140000,
        subsidyAmount: 0,
        finalSalePrice: 1140000,
        cashAmount: 340000,
        cardAmount: 800000,
        bankTransferAmount: 0,
        cardInstallmentMonths: 6,
        actualReceivedAmount: 1140000,
        receivableAmount: 0,
        deviceCostAmount: 912000,
        rebateAmount: 250000,
        policyRevenueAmount: 0,
        profitCalculationBaseAmount: 1140000,
        profitDeductionAmount: 0,
        totalProfitAmount: 250000,
        appliedSaleProfitPolicyId: "profit-skt-default-202604",
        appliedDiscountPolicyId: "discount-carrier-skt-202604",
        appliedSaleProfitPolicyName: "SKT 판매수익 기본 정책",
        appliedDiscountPolicyName: "SKT 통신사 할인율",
      },
      {
        id: "sale-20260409-jung",
        saleDate: at("2026-04-09T16:15:00+09:00"),
        status: SaleStatus.COMPLETED,
        customerId: "customer-jung-haeun",
        staffId: "user-lee-dy",
        carrierId: "carrier-lgu",
        ratePlanId: "plan-lgu-premier",
        inventoryItemId: "inventory-zflip6-001",
        deviceModelId: "device-z-flip-6",
        listPrice: 1390000,
        discountApplied: false,
        discountAmount: 0,
        discountedPrice: 1390000,
        subsidyAmount: 0,
        finalSalePrice: 1390000,
        cashAmount: 0,
        cardAmount: 970000,
        bankTransferAmount: 0,
        cardInstallmentMonths: 12,
        actualReceivedAmount: 970000,
        receivableAmount: 420000,
        deviceCostAmount: 1180000,
        rebateAmount: 420000,
        policyRevenueAmount: 120000,
        profitCalculationBaseAmount: 1390000,
        profitDeductionAmount: 0,
        totalProfitAmount: 540000,
        appliedRebatePolicyId: "rebate-lgu-zflip6-20260401",
        appliedSaleProfitPolicyId: "profit-lgu-flip-202604",
        appliedRebatePolicyName: "LG U+ Z Flip 6 리베이트",
        appliedSaleProfitPolicyName: "LG U+ 플립6 고정 수익 정책",
      },
      {
        id: "sale-20260408-oh",
        saleDate: at("2026-04-08T18:40:00+09:00"),
        status: SaleStatus.COMPLETED,
        customerId: "customer-oh-sion",
        staffId: "user-kim-jh",
        carrierId: "carrier-skt",
        ratePlanId: "plan-skt-5gx",
        inventoryItemId: "inventory-a56-001",
        deviceModelId: "device-galaxy-a56",
        listPrice: 880000,
        discountApplied: true,
        discountMethod: DiscountMethod.FIXED_AMOUNT,
        discountValue: 80000,
        discountSuggestionMethod: DiscountMethod.PERCENTAGE,
        discountSuggestionValue: 5,
        discountAmount: 80000,
        discountedPrice: 800000,
        subsidyAmount: 0,
        finalSalePrice: 800000,
        cashAmount: 200000,
        cardAmount: 220000,
        bankTransferAmount: 0,
        cardInstallmentMonths: 3,
        actualReceivedAmount: 420000,
        receivableAmount: 380000,
        deviceCostAmount: 620000,
        rebateAmount: 0,
        policyRevenueAmount: 0,
        profitCalculationBaseAmount: 800000,
        profitDeductionAmount: 0,
        totalProfitAmount: 0,
        appliedSaleProfitPolicyId: "profit-skt-default-202604",
        appliedSaleProfitPolicyName: "SKT 판매수익 기본 정책",
      },
    ],
  });

  await prisma.saleAddOnService.createMany({
    data: [
      {
        saleId: "sale-20260411-kim",
        addOnServiceId: "service-kt-insurance",
        nameSnapshot: "KT 폰 안심보험",
        monthlyFee: 7900,
      },
      {
        saleId: "sale-20260408-oh",
        addOnServiceId: "service-skt-combine",
        nameSnapshot: "가족 결합 할인",
        monthlyFee: 0,
      },
    ],
  });

  await prisma.receivable.createMany({
    data: [
      {
        id: "receivable-sale-kim",
        saleId: "sale-20260411-kim",
        customerId: "customer-kim-seohyun",
        status: ReceivableStatus.PARTIALLY_PAID,
        originalAmount: 300000,
        balanceAmount: 180000,
        memo: "오늘 방문 예정",
      },
      {
        id: "receivable-sale-jung",
        saleId: "sale-20260409-jung",
        customerId: "customer-jung-haeun",
        status: ReceivableStatus.UNPAID,
        originalAmount: 420000,
        balanceAmount: 420000,
        memo: "3일 경과",
      },
      {
        id: "receivable-sale-oh",
        saleId: "sale-20260408-oh",
        customerId: "customer-oh-sion",
        status: ReceivableStatus.UNPAID,
        originalAmount: 380000,
        balanceAmount: 380000,
        memo: "오늘 수납 약속",
      },
    ],
  });

  await prisma.payment.createMany({
    data: [
      {
        id: "payment-kim-1",
        receivableId: "receivable-sale-kim",
        saleId: "sale-20260411-kim",
        staffId: "user-park-sy",
        paymentDate: at("2026-04-11T18:00:00+09:00"),
        amount: 120000,
        method: PaymentMethod.BANK_TRANSFER,
        memo: "1차 부분 수납",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
