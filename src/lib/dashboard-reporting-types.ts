export const dashboardPresets = ["today", "week", "month", "custom"] as const;

export type DashboardPreset = (typeof dashboardPresets)[number];

type DashboardTone = "amber" | "teal" | "rose" | "slate";
type DashboardAccent = "amber" | "teal" | "slate";
type ReceivableStatusValue = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export interface DashboardFilters {
  preset: DashboardPreset;
  dateFrom: string;
  dateTo: string;
  storeId: string;
  staffId: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
  accent: DashboardAccent;
}

export interface DashboardAttentionItem {
  title: string;
  detail: string;
  badge: string;
  tone: DashboardTone;
}

export interface DashboardStaffSummary {
  staffId: string;
  staffName: string;
  salesCount: number;
  paymentCount: number;
  salesAmount: number;
  collectedAmount: number;
  additionalPaymentAmount: number;
  profitAmount: number;
}

export interface DashboardStoreSummary {
  storeId: string;
  storeName: string;
  salesCount: number;
  salesAmount: number;
  collectedAmount: number;
  additionalPaymentAmount: number;
  profitAmount: number;
}

export interface DashboardStoreOption {
  id: string;
  name: string;
}

export interface DashboardStaffOption {
  id: string;
  name: string;
}

export interface DashboardDailySummary {
  date: string;
  salesCount: number;
  salesAmount: number;
  collectedAmount: number;
  rebateAmount: number;
  policyRevenueAmount: number;
  profitAmount: number;
}

export interface DashboardRecentSale {
  id: string;
  saleDate: string;
  customerName: string;
  carrierName: string;
  deviceModelName: string;
  staffName: string;
  collectedAmount: number;
  receivableAmount: number;
  receivableStatus: ReceivableStatusValue | null;
  profitAmount: number;
}

export interface DashboardReceivableSnapshot {
  customerName: string;
  carrierName: string;
  deviceModelName: string;
  balanceAmount: number;
}

export interface DashboardActivationEligibleCustomer {
  customerId: string;
  customerName: string;
  carrierName: string;
  lastSaleDate: string;
  eligibleDate: string;
  daysUntil: number;
  ruleLabel: string;
}

export interface DashboardCarrierTrendPoint {
  date: string;
  count: number;
}

export interface DashboardCarrierTrendSeries {
  carrierName: string;
  totalCount: number;
  points: DashboardCarrierTrendPoint[];
}

export interface DashboardReceivableHealthBucket {
  id: string;
  label: string;
  count: number;
  balanceAmount: number;
  tone: DashboardTone;
}

export interface DashboardUpcomingScheduleRow {
  id: string;
  dateInput: string;
  kindLabel: string;
  title: string;
  customerName: string | null;
  subtitle: string | null;
  statusLabel: string;
}

export interface DashboardSummary {
  todaySalesCount: number;
  todayCanceledSalesCount: number;
  todayInitialReceivedAmount: number;
  todayAdditionalPaymentAmount: number;
  todayCollectedAmount: number;
  currentReceivableBalance: number;
  currentReceivableCount: number;
  partialReceivableCount: number;
  activationEligibleCount: number;
  periodSalesCount: number;
  periodSalesAmount: number;
  periodInitialReceivedAmount: number;
  periodAdditionalPaymentAmount: number;
  periodCollectedAmount: number;
  periodReceivableCreatedAmount: number;
  periodRebateAmount: number;
  periodPolicyRevenueAmount: number;
  periodProfitAmount: number;
}

export interface DashboardReportData {
  filters: DashboardFilters;
  periodLabel: string;
  generatedAt: string;
  availableStores: DashboardStoreOption[];
  availableStaffs: DashboardStaffOption[];
  metrics: DashboardMetric[];
  summary: DashboardSummary;
  attentionItems: DashboardAttentionItem[];
  receivableSnapshots: DashboardReceivableSnapshot[];
  storeSummaries: DashboardStoreSummary[];
  staffSummaries: DashboardStaffSummary[];
  receivableHealthBuckets: DashboardReceivableHealthBucket[];
  dailySummaries: DashboardDailySummary[];
  recentSales: DashboardRecentSale[];
  activationEligibleCustomers: DashboardActivationEligibleCustomer[];
  retentionTopCustomers: DashboardActivationEligibleCustomer[];
  upcomingScheduleRows: DashboardUpcomingScheduleRow[];
  carrierTrendSeries: DashboardCarrierTrendSeries[];
}
