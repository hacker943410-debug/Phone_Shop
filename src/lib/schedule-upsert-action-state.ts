import type { ManualScheduleStatusValue } from "@/lib/schedule";

export interface ScheduleUpsertActionFields {
  id: string;
  title: string;
  scheduledDate: string;
  status: ManualScheduleStatusValue;
  customerId: string;
  memo: string;
  saleId: string;
  saleCustomerId: string;
}

export interface ScheduleUpsertActionState {
  status: "idle" | "error" | "success";
  message: string | null;
  deleted: boolean;
  scheduleId: string | null;
  fields: ScheduleUpsertActionFields;
}

const emptyFields: ScheduleUpsertActionFields = {
  id: "",
  title: "",
  scheduledDate: "",
  status: "OPEN",
  customerId: "",
  memo: "",
  saleId: "",
  saleCustomerId: "",
};

export function buildScheduleUpsertActionState(
  overrides?: Partial<ScheduleUpsertActionState>,
): ScheduleUpsertActionState {
  return {
    status: "idle",
    message: null,
    deleted: false,
    scheduleId: null,
    fields: {
      ...emptyFields,
      ...(overrides?.fields ?? {}),
    },
    ...overrides,
  };
}
