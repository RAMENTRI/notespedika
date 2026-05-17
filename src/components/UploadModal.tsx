"use client";

import { FormEvent, useState } from "react";
import { FileUp, X } from "lucide-react";

type UploadModalProps = {
  isOpen: boolean;
  isUploading: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; description: string; file: File }) => Promise<void>;
};

export function UploadModal({ isOpen, isUploading, onClose, onSubmit }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const selectedFile = (form.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0] ?? file;

    if (!selectedFile) {
      return;
    }

    await onSubmit({ title, description, file: selectedFile });
    setTitle("");
    setDescription("");
    setFile(null);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/45 px-4 py-8">
      <div className="w-full max-w-xl rounded-md bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Upload PDF notes</h2>
            <p className="mt-1 text-sm font-semibold text-mint-600">Earn 50 credits for uploading!</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close upload form"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Document Title</span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-line px-3 py-3 text-sm"
              placeholder="Organic chemistry quick revision"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="focus-ring mt-2 min-h-28 w-full rounded-md border border-line px-3 py-3 text-sm"
              placeholder="Add course, semester, topic coverage, or exam relevance."
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">PDF File</span>
            <input
              required
              name="file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="focus-ring mt-2 w-full rounded-md border border-dashed border-brand-100 bg-brand-50 px-3 py-4 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={isUploading}
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-mint-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-mint-500 disabled:bg-slate-300"
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            {isUploading ? "Uploading..." : "Upload and earn credits"}
          </button>
        </form>
      </div>
    </div>
  );
}
