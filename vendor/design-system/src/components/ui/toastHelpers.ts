// Copied from pingdotgg/t3code apps/web/src/components/ui/toastHelpers.ts (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes: `ThreadToastData` is `ToastData` (Lanes has no threads); the
// helper keeps t3code's name, so a toast raised the t3code way reads the same.

import type { ToastManagerAddOptions } from "@base-ui/react/toast";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { ToastData } from "./toast";

export type StackedThreadToastOptions = {
  type: "error" | "warning" | "success" | "info" | "loading";
  title: ReactNode;
  description?: ReactNode;
  timeout?: number;
  priority?: "low" | "high";
  actionProps?: ComponentPropsWithoutRef<"button">;
  actionVariant?: ToastData["actionVariant"];
  data?: Omit<ToastData, "actionLayout">;
};

export function stackedThreadToast(options: StackedThreadToastOptions): ToastManagerAddOptions<ToastData> {
  const { type, title, description, timeout, priority, actionProps, actionVariant, data } = options;

  const mergedData: ToastData = {
    ...(data !== undefined ? data : {}),
    actionLayout: "stacked-end",
  };
  if (actionVariant !== undefined) {
    mergedData.actionVariant = actionVariant;
  }

  const payload: ToastManagerAddOptions<ToastData> = {
    type,
    title,
    data: mergedData,
  };

  if (description !== undefined) {
    payload.description = description;
  }
  if (timeout !== undefined) {
    payload.timeout = timeout;
  }
  if (priority !== undefined) {
    payload.priority = priority;
  }
  if (actionProps !== undefined) {
    payload.actionProps = actionProps;
  }

  return payload;
}
