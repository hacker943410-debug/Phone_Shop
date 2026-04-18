import type {
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
} from "@/components/workspace/sales-types";

export interface CustomerMappedSelection {
  inventoryItemId: string | null;
  ratePlanId: string;
  selectedAddOnServiceIds: string[];
}

interface ResolveCustomerMappedSelectionInput {
  customer: SalesCustomerRecord | null;
  currentInventoryItemId: string;
  availableInventory: SalesAvailableInventoryRecord[];
  carriers: SalesCarrierRecord[];
}

export function resolveCustomerMappedSelection(
  input: ResolveCustomerMappedSelectionInput,
): CustomerMappedSelection | null {
  if (!input.customer?.currentCarrierId) {
    return null;
  }

  const carrier = input.carriers.find(
    (candidate) => candidate.id === input.customer?.currentCarrierId,
  );

  if (!carrier) {
    return null;
  }

  const compatibleInventory = input.availableInventory.filter(
    (inventoryItem) => inventoryItem.carrierId === input.customer?.currentCarrierId,
  );
  const currentInventory = compatibleInventory.find(
    (inventoryItem) => inventoryItem.id === input.currentInventoryItemId,
  );
  const preferredInventory =
    compatibleInventory.find(
      (inventoryItem) =>
        inventoryItem.deviceModelId === input.customer?.latestSaleDeviceModelId,
    ) ??
    currentInventory ??
    compatibleInventory[0] ??
    null;

  const availableRatePlanIds = new Set(carrier.ratePlans.map((ratePlan) => ratePlan.id));
  const ratePlanId =
    input.customer.latestSaleRatePlanId &&
    availableRatePlanIds.has(input.customer.latestSaleRatePlanId)
      ? input.customer.latestSaleRatePlanId
      : (carrier.ratePlans[0]?.id ?? "");

  const availableAddOnServiceIds = new Set(
    carrier.addOnServices.map((service) => service.id),
  );
  const selectedAddOnServiceIds = input.customer.latestSaleAddOnServiceIds.filter(
    (serviceId) => availableAddOnServiceIds.has(serviceId),
  );

  return {
    inventoryItemId: preferredInventory?.id ?? null,
    ratePlanId,
    selectedAddOnServiceIds,
  };
}
