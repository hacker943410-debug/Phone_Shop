"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  CustomerUpsertDialog,
  type CustomerUpsertDialogCarrier,
  type CustomerUpsertDialogSeed,
} from "@/components/workspace/customer-upsert-dialog";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";

interface CustomerEditorLauncherProps {
  carriers: CustomerUpsertDialogCarrier[];
  selectedCustomer: CustomerUpsertDialogSeed | null;
  successBaseHref: string;
}

type EditorMode = "create" | "edit" | null;

function buildCustomerFocusHref(baseHref: string, customerId: string) {
  const [pathname, search = ""] = baseHref.split("?");
  const searchParams = new URLSearchParams(search);

  searchParams.set("customerId", customerId);

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function CustomerEditorLauncher({
  carriers,
  selectedCustomer,
  successBaseHref,
}: CustomerEditorLauncherProps) {
  const router = useRouter();
  const [mode, setMode] = useState<EditorMode>(null);

  function handleSuccess(customer: { id: string }) {
    setMode(null);
    router.push(buildCustomerFocusHref(successBaseHref, customer.id));
    router.refresh();
  }

  return (
    <>
      <button
        className={`${primaryButtonClassName} h-10 px-4`}
        onClick={() => setMode("create")}
        type="button"
      >
        고객 등록
      </button>
      {selectedCustomer ? (
        <button
          className={`${secondaryButtonClassName} h-10 px-4`}
          onClick={() => setMode("edit")}
          type="button"
        >
          선택 고객 수정
        </button>
      ) : null}

      {mode ? (
        <CustomerUpsertDialog
          key={`${mode}:${selectedCustomer?.id ?? "new"}`}
          carriers={carriers}
          description={
            mode === "edit"
              ? "선택한 고객 정보를 수정하면 현재 목록과 상세 패널이 함께 갱신됩니다."
              : "연락처 기준으로 중복을 방지하면서 신규 고객을 등록합니다."
          }
          initialCustomer={mode === "edit" ? selectedCustomer : null}
          onClose={() => setMode(null)}
          onSuccess={handleSuccess}
          submitLabel={mode === "edit" ? "고객 수정 저장" : "고객 등록"}
          subtitle={mode === "edit" ? "Customer Edit" : "Customer Create"}
          title={mode === "edit" ? "고객 수정" : "고객 등록"}
        />
      ) : null}
    </>
  );
}
