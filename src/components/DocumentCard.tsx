"use client";

import { Download, FileText } from "lucide-react";
import type { DocumentRow } from "@/lib/types";

type DocumentCardProps = {
  document: DocumentRow;
  disabled?: boolean;
  onDownload: (document: DocumentRow) => void;
};

export function DocumentCard({ document, disabled, onDownload }: DocumentCardProps) {
  const uploader = document.users?.name || document.users?.email || "Notespedika member";

  return (
    <article className="rounded-md border border-line bg-white p-5 shadow-sm transition hover:border-brand-100 hover:shadow-soft">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
          <FileText className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-semibold text-ink">{document.title}</h3>
          <p className="mt-1 text-sm text-slate-500">Uploaded by {uploader}</p>
          {document.description ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{document.description}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDownload(document)}
        className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-300"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download (-{document.download_cost} Credits)
      </button>
    </article>
  );
}
