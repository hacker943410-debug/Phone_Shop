"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/dal";
import { parseKstDateInput } from "@/lib/date-utils";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/phone-utils";
import { prisma } from "@/lib/prisma";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readOptionalDate(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value ? parseKstDateInput(value, "start") : null;
}

function revalidateCustomerViews() {
  revalidatePath("/customers");
  revalidatePath("/sales");
  revalidatePath("/sales/new");
}

async function ensureUniquePhone(id: string | null, normalizedPhone: string) {
  const duplicate = await prisma.customer.findFirst({
    where: {
      normalizedPhone,
      ...(id ? { id: { not: id } } : {}),
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    redirect("/customers?notice=duplicate-phone");
  }
}

export async function upsertCustomerAction(formData: FormData) {
  await requireCurrentUser();

  const id = readOptionalText(formData, "id");
  const name = readText(formData, "name");
  const phoneInput = readText(formData, "phone");
  const normalizedPhone = normalizePhoneNumber(phoneInput);
  const birthDate = readOptionalDate(formData, "birthDate");
  const address = readOptionalText(formData, "address");
  const memo = readOptionalText(formData, "memo");
  const currentCarrierId = readOptionalText(formData, "currentCarrierId");

  if (!name || normalizedPhone.length < 9) {
    redirect("/customers?notice=invalid-customer-form");
  }

  await ensureUniquePhone(id, normalizedPhone);

  const data = {
    name,
    phone: formatPhoneNumber(normalizedPhone),
    normalizedPhone,
    birthDate,
    address,
    memo,
    currentCarrierId,
  };

  if (id) {
    await prisma.customer.update({
      where: {
        id,
      },
      data,
    });
  } else {
    await prisma.customer.create({
      data,
    });
  }

  revalidateCustomerViews();
}
