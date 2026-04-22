"use client";

import { useRef, useState, type ComponentProps } from "react";

import {
  interactiveButtonClassName,
  joinClassNames,
} from "@/components/workspace/ui-classnames";
import { WorkspaceAlertDialog } from "@/components/workspace/workspace-alert-dialog";

interface ConfirmSubmitButtonProps extends Omit<ComponentProps<"button">, "type"> {
  confirmMessage: string;
}

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  children,
  className,
  ...props
}: ConfirmSubmitButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const allowSubmitRef = useRef(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <button
        {...props}
        ref={buttonRef}
        type="submit"
        className={joinClassNames(interactiveButtonClassName, className)}
        onClick={(event) => {
          if (allowSubmitRef.current) {
            allowSubmitRef.current = false;
            onClick?.(event);
            return;
          }

          event.preventDefault();
          setIsConfirmOpen(true);
        }}
      >
        {children}
      </button>

      <WorkspaceAlertDialog
        message={confirmMessage}
        onClose={() => setIsConfirmOpen(false)}
        onPrimaryAction={() => {
          allowSubmitRef.current = true;
          setIsConfirmOpen(false);
          buttonRef.current?.click();
        }}
        open={isConfirmOpen}
        primaryActionLabel="확인"
        secondaryActionLabel="취소"
        subtitle="Confirmation"
        title="한 번 더 확인해 주세요"
        tone="warning"
      />
    </>
  );
}
