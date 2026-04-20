"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUser } from "@/lib/auth/dal";
import { parseKstDateInput } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import {
  buildScheduleUpsertActionState,
  type ScheduleUpsertActionFields,
  type ScheduleUpsertActionState,
} from "@/lib/schedule-upsert-action-state";
import type { ManualScheduleStatusValue } from "@/lib/schedule";

type ScheduleDialogIntent = "save" | "delete";

interface ManualScheduleInput {
  customerId: string | null;
  fields: ScheduleUpsertActionFields;
  id: string | null;
  intent: ScheduleDialogIntent;
  memo: string | null;
  saleCustomerId: string | null;
  saleId: string | null;
  scheduledDate: Date | null;
  scheduledDateInput: string;
  status: ManualScheduleStatusValue;
  title: string;
}

const manualScheduleStatuses = new Set<ManualScheduleStatusValue>([
  "OPEN",
  "DONE",
  "CANCELED",
]);

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readIntent(formData: FormData): ScheduleDialogIntent {
  return readText(formData, "intent") === "delete" ? "delete" : "save";
}

function readStatus(formData: FormData): ManualScheduleStatusValue {
  const value = readText(formData, "status");
  return manualScheduleStatuses.has(value as ManualScheduleStatusValue)
    ? (value as ManualScheduleStatusValue)
    : "OPEN";
}

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function readManualScheduleInput(formData: FormData): ManualScheduleInput {
  const id = readOptionalText(formData, "id");
  const title = readText(formData, "title");
  const scheduledDateInput = readText(formData, "scheduledDate");
  const scheduledDate = isValidDateInput(scheduledDateInput)
    ? parseKstDateInput(scheduledDateInput, "start")
    : null;
  const status = readStatus(formData);
  const customerId = readOptionalText(formData, "customerId");
  const memo = readOptionalText(formData, "memo");
  const saleId = readOptionalText(formData, "saleId");
  const saleCustomerId = readOptionalText(formData, "saleCustomerId");

  return {
    id,
    title,
    scheduledDateInput,
    scheduledDate,
    status,
    customerId,
    memo,
    saleId,
    saleCustomerId,
    intent: readIntent(formData),
    fields: {
      id: id ?? "",
      title,
      scheduledDate: scheduledDateInput,
      status,
      customerId: customerId ?? "",
      memo: memo ?? "",
      saleId: saleId ?? "",
      saleCustomerId: saleCustomerId ?? "",
    },
  };
}

function buildScheduleActionState(
  overrides?: Partial<ScheduleUpsertActionState>,
): ScheduleUpsertActionState {
  return buildScheduleUpsertActionState(overrides);
}

function revalidateScheduleViews() {
  revalidatePath("/schedule");
}

async function resolveCustomerId(customerId: string | null) {
  if (!customerId) {
    return null;
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      isHidden: false,
    },
    select: {
      id: true,
    },
  });

  return customer?.id ?? null;
}

async function resolveSale(input: ManualScheduleInput) {
  if (!input.saleId) {
    return null;
  }

  const sale = await prisma.sale.findUnique({
    where: {
      id: input.saleId,
    },
    select: {
      id: true,
      customerId: true,
    },
  });

  if (!sale) {
    return {
      error: "연결된 판매 이력을 찾을 수 없습니다. 일정을 다시 열어 저장해 주세요.",
      sale: null,
    };
  }

  if (input.customerId && sale.customerId !== input.customerId) {
    return {
      error: "연결된 판매 이력의 고객과 선택한 고객이 일치하지 않습니다.",
      sale: null,
    };
  }

  if (input.saleCustomerId && sale.customerId !== input.saleCustomerId) {
    return {
      error: "판매 연결 정보가 변경되었습니다. 일정을 다시 열어 확인해 주세요.",
      sale: null,
    };
  }

  return {
    error: null,
    sale,
  };
}

export async function upsertManualScheduleDialogAction(
  _previousState: ScheduleUpsertActionState,
  formData: FormData,
): Promise<ScheduleUpsertActionState> {
  const user = await requireCurrentUser();
  const input = readManualScheduleInput(formData);

  if (input.intent === "delete") {
    if (!input.id) {
      return buildScheduleActionState({
        status: "error",
        message: "삭제할 일정 정보를 찾을 수 없습니다.",
        fields: input.fields,
      });
    }

    const existingSchedule = await prisma.manualSchedule.findUnique({
      where: {
        id: input.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingSchedule) {
      return buildScheduleActionState({
        status: "error",
        message: "이미 삭제되었거나 찾을 수 없는 일정입니다.",
        fields: input.fields,
      });
    }

    await prisma.manualSchedule.delete({
      where: {
        id: input.id,
      },
    });

    revalidateScheduleViews();

    return buildScheduleActionState({
      status: "success",
      message: "일정을 삭제했습니다.",
      deleted: true,
      fields: input.fields,
    });
  }

  if (!input.title || !input.scheduledDate) {
    return buildScheduleActionState({
      status: "error",
      message: "제목과 일정일을 확인해 주세요.",
      fields: input.fields,
    });
  }

  const resolvedCustomerId = await resolveCustomerId(input.customerId);

  if (input.customerId && !resolvedCustomerId) {
    return buildScheduleActionState({
      status: "error",
      message: "선택한 고객을 찾을 수 없습니다.",
      fields: input.fields,
    });
  }

  const saleResult = await resolveSale(input);

  if (saleResult?.error) {
    return buildScheduleActionState({
      status: "error",
      message: saleResult.error,
      fields: input.fields,
    });
  }

  const linkedCustomerId = resolvedCustomerId ?? saleResult?.sale?.customerId ?? null;
  const data = {
    title: input.title,
    scheduledDate: input.scheduledDate,
    status: input.status,
    customerId: linkedCustomerId,
    memo: input.memo,
    saleId: saleResult?.sale?.id ?? input.saleId ?? null,
  };

  if (input.id) {
    const existingSchedule = await prisma.manualSchedule.findUnique({
      where: {
        id: input.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingSchedule) {
      return buildScheduleActionState({
        status: "error",
        message: "수정할 일정을 찾을 수 없습니다.",
        fields: input.fields,
      });
    }

    const updated = await prisma.manualSchedule.update({
      where: {
        id: input.id,
      },
      data,
      select: {
        id: true,
      },
    });

    revalidateScheduleViews();

    return buildScheduleActionState({
      status: "success",
      message: "일정을 저장했습니다.",
      scheduleId: updated.id,
      fields: {
        ...input.fields,
        customerId: linkedCustomerId ?? "",
      },
    });
  }

  const created = await prisma.manualSchedule.create({
    data: {
      ...data,
      createdById: user.id,
    },
    select: {
      id: true,
    },
  });

  revalidateScheduleViews();

  return buildScheduleActionState({
    status: "success",
    message: "일정을 등록했습니다.",
    scheduleId: created.id,
    fields: {
      ...input.fields,
      id: created.id,
      customerId: linkedCustomerId ?? "",
    },
  });
}
