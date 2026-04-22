const kstPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export interface CustomerContractSaleInput {
  saleDate: Date;
  status: "COMPLETED" | "CANCELED";
  deviceModelName: string;
  ratePlanName: string | null;
  ratePlanMonthlyFee: number | null;
  listPrice: number;
  subsidyAmount: number;
  installmentMonths: number | null;
}

export interface CustomerActiveContractSummary {
  saleDate: Date;
  deviceModelName: string;
  ratePlanName: string | null;
  ratePlanMonthlyFee: number | null;
  deviceInstallmentPrincipal: number;
  installmentMonths: number | null;
  monthlyInstallmentAmount: number | null;
  remainingInstallmentAmount: number | null;
  remainingInstallmentMonths: number | null;
}

function getKstDateParts(date: Date) {
  const formatted = kstPartsFormatter.format(date);
  const [year, month, day] = formatted.split("-").map((value) => Number.parseInt(value, 10));

  return {
    year,
    month,
    day,
  };
}

export function calculateDeviceInstallmentPrincipal(listPrice: number, subsidyAmount: number) {
  return Math.max(0, listPrice - subsidyAmount);
}

export function calculateElapsedInstallmentMonths(saleDate: Date, referenceDate = new Date()) {
  const saleParts = getKstDateParts(saleDate);
  const referenceParts = getKstDateParts(referenceDate);
  let months =
    (referenceParts.year - saleParts.year) * 12 +
    (referenceParts.month - saleParts.month);

  if (referenceParts.day < saleParts.day) {
    months -= 1;
  }

  return Math.max(0, months);
}

export function calculateMonthlyInstallmentAmount(
  principalAmount: number,
  installmentMonths: number | null,
) {
  if (!installmentMonths || installmentMonths <= 0) {
    return null;
  }

  return Math.ceil(principalAmount / installmentMonths);
}

export function calculateRemainingInstallmentSummary(
  principalAmount: number,
  installmentMonths: number | null,
  elapsedMonths: number,
) {
  if (!installmentMonths || installmentMonths <= 0) {
    return {
      remainingInstallmentAmount: null,
      remainingInstallmentMonths: null,
    };
  }

  const normalizedElapsedMonths = Math.max(
    0,
    Math.min(installmentMonths, elapsedMonths),
  );
  const remainingInstallmentMonths = Math.max(
    0,
    installmentMonths - normalizedElapsedMonths,
  );

  return {
    remainingInstallmentAmount: Math.ceil(
      (principalAmount * remainingInstallmentMonths) / installmentMonths,
    ),
    remainingInstallmentMonths,
  };
}

export function buildCustomerActiveContractSummary(
  sales: CustomerContractSaleInput[],
  referenceDate = new Date(),
): CustomerActiveContractSummary | null {
  const latestCompletedSale =
    sales.find((sale) => sale.status === "COMPLETED") ?? null;

  if (!latestCompletedSale) {
    return null;
  }

  const deviceInstallmentPrincipal = calculateDeviceInstallmentPrincipal(
    latestCompletedSale.listPrice,
    latestCompletedSale.subsidyAmount,
  );
  const elapsedInstallmentMonths = calculateElapsedInstallmentMonths(
    latestCompletedSale.saleDate,
    referenceDate,
  );
  const monthlyInstallmentAmount = calculateMonthlyInstallmentAmount(
    deviceInstallmentPrincipal,
    latestCompletedSale.installmentMonths,
  );
  const { remainingInstallmentAmount, remainingInstallmentMonths } =
    calculateRemainingInstallmentSummary(
      deviceInstallmentPrincipal,
      latestCompletedSale.installmentMonths,
      elapsedInstallmentMonths,
    );

  return {
    saleDate: latestCompletedSale.saleDate,
    deviceModelName: latestCompletedSale.deviceModelName,
    ratePlanName: latestCompletedSale.ratePlanName,
    ratePlanMonthlyFee: latestCompletedSale.ratePlanMonthlyFee,
    deviceInstallmentPrincipal,
    installmentMonths: latestCompletedSale.installmentMonths,
    monthlyInstallmentAmount,
    remainingInstallmentAmount,
    remainingInstallmentMonths,
  };
}
