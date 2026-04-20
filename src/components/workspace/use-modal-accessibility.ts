"use client";

import { useEffect, useRef, type RefObject } from "react";

const focusableSelector = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

let activeBodyScrollLocks = 0;
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((element) => {
    if (element.hasAttribute("disabled") || element.getAttribute("aria-hidden") === "true") {
      return false;
    }

    return element.getClientRects().length > 0;
  });
}

function focusElement(target: HTMLElement | null | undefined) {
  if (!target) {
    return false;
  }

  target.focus();
  return document.activeElement === target;
}

function lockBodyScroll() {
  if (activeBodyScrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  activeBodyScrollLocks += 1;
}

function unlockBodyScroll() {
  activeBodyScrollLocks = Math.max(0, activeBodyScrollLocks - 1);

  if (activeBodyScrollLocks === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
  }
}

function trapFocus(event: KeyboardEvent, container: HTMLElement) {
  if (event.key !== "Tab") {
    return;
  }

  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;

  if (event.shiftKey) {
    if (activeElement === firstElement || activeElement === container) {
      event.preventDefault();
      lastElement.focus();
    }

    return;
  }

  if (activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

interface UseModalAccessibilityOptions {
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

export function useModalAccessibility({
  containerRef,
  initialFocusRef,
  isOpen,
  onClose,
}: UseModalAccessibilityOptions) {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    const activeContainer: HTMLElement = container;

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    lockBodyScroll();

    const focusFrame = window.requestAnimationFrame(() => {
      const preferredFocus = initialFocusRef?.current ?? null;
      const focusableElements = getFocusableElements(activeContainer);

      if (
        !focusElement(preferredFocus) &&
        !focusElement(focusableElements[0])
      ) {
        activeContainer.focus();
      }
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      trapFocus(event, activeContainer);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      unlockBodyScroll();

      const previousActiveElement = previousActiveElementRef.current;

      if (previousActiveElement?.isConnected) {
        window.requestAnimationFrame(() => {
          previousActiveElement.focus();
        });
      }
    };
  }, [containerRef, initialFocusRef, isOpen]);
}
