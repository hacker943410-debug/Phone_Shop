export interface CustomerUpsertActionCustomer {
  id: string;
  name: string;
  phone: string;
  currentCarrierId: string | null;
  currentCarrierName: string | null;
  birthDate: string | null;
  address: string | null;
  memo: string | null;
}

export interface CustomerUpsertActionFields {
  id: string;
  name: string;
  phone: string;
  currentCarrierId: string;
  birthDate: string;
  address: string;
  memo: string;
}

export interface CustomerUpsertActionState {
  status: "idle" | "error" | "success";
  message: string | null;
  fields: CustomerUpsertActionFields;
  customer: CustomerUpsertActionCustomer | null;
}

const emptyCustomerUpsertFields: CustomerUpsertActionFields = {
  id: "",
  name: "",
  phone: "",
  currentCarrierId: "",
  birthDate: "",
  address: "",
  memo: "",
};

export function buildCustomerUpsertActionState(
  overrides?: Partial<CustomerUpsertActionState>,
): CustomerUpsertActionState {
  const fields = {
    ...emptyCustomerUpsertFields,
    ...(overrides?.fields ?? {}),
  };

  return {
    status: "idle",
    message: null,
    customer: null,
    ...overrides,
    fields,
  };
}
