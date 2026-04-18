"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceModalShell } from "@/components/workspace/workspace-modal-shell";

interface QueryModalShellProps {
  children: React.ReactNode;
  closeHref: string;
  contentClassName?: string;
  maxWidthClassName?: string;
  subtitle: string;
  title: string;
}

export function QueryModalShell({
  children,
  closeHref,
  contentClassName,
  maxWidthClassName,
  subtitle,
  title,
}: QueryModalShellProps) {
  const router = useRouter();

  const closeModal = useCallback(() => {
    router.replace(closeHref, { scroll: false });
  }, [closeHref, router]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal]);

  return (
    <WorkspaceModalShell
      contentClassName={contentClassName}
      maxWidthClassName={maxWidthClassName}
      onClose={closeModal}
      subtitle={subtitle}
      title={title}
    >
      {children}
    </WorkspaceModalShell>
  );
}
