"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import type { Toast as ToastType } from "@/lib/types";

type ToastProps = {
  toast: ToastType | null;
};

export function Toast({ toast }: ToastProps) {
  if (!toast) {
    return null;
  }

  const styles = {
    success: "border-mint-500 bg-mint-50 text-mint-600",
    error: "border-red-500 bg-red-50 text-red-700",
    info: "border-brand-500 bg-brand-50 text-brand-700",
  };

  const Icon = toast.type === "success" ? CheckCircle2 : toast.type === "error" ? XCircle : Info;

  return (
    <div
      role="status"
      className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-md border bg-white px-4 py-3 text-sm shadow-soft ${styles[toast.type]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{toast.message}</span>
    </div>
  );
}
