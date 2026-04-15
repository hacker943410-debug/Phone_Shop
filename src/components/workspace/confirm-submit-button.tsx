"use client";

import type { ComponentProps } from "react";

import {
  interactiveButtonClassName,
  joinClassNames,
} from "@/components/workspace/ui-classnames";

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
  return (
    <button
      type="submit"
      className={joinClassNames(interactiveButtonClassName, className)}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
