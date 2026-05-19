"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, Search, UploadCloud } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { CreditBadge } from "@/components/CreditBadge";
import { DocumentCard } from "@/components/DocumentCard";
import { Toast } from "@/components/Toast";
import { UploadModal } from "@/components/UploadModal";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DocumentRow, Profile, Toast as ToastType } from "@/lib/types";

const UPLOAD_REWARD = 50;

function withTimeout<T>(promise: PromiseLike<T>, message: string, timeoutMs = 20000) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<ToastType | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);

  const showToast = useCallback((nextToast: ToastType) => {
    setToast(nextToast);
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const loadDashboard = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      return;
    }

    const [{ data: profileData, error: profileError }, { data: documentData, error: documentError }] = await Promise.all([
      supabase.rpc("ensure_user_profile"),
      supabase
        .from("documents")
        .select("*, users(name, email)")
        .order("created_at", { ascending: false }),
    ]);

    if (profileError) {
      showToast({
        type: "error",
        message: `${profileError.message}. Run the updated supabase/schema.sql in Supabase SQL Editor.`,
      });
    } else {
      setProfile(profileData as Profile);
    }

    if (documentError) {
      showToast({ type: "error", message: documentError.message });
    } else {
      setDocuments((documentData as DocumentRow[]) ?? []);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      window.setTimeout(() => {
        showToast({ type: "error", message: "Add Supabase keys to .env.local before using the app." });
      }, 0);
      return;
    }

    loadDashboard();
  }, [loadDashboard, showToast]);

  const filteredDocuments = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return documents;
    }

    return documents.filter((document) => {
      return (
        document.title.toLowerCase().includes(trimmedQuery) ||
        (document.description ?? "").toLowerCase().includes(trimmedQuery)
      );
    });
  }, [documents, query]);

  async function handleUpload(payload: { title: string; description: string; file: File }) {
    if (!profile) {
      showToast({
        type: "error",
        message: "Your profile is still loading or was not created. Sign out, login again, then retry.",
      });
      return;
    }

    if (payload.file.type !== "application/pdf" && !payload.file.name.toLowerCase().endsWith(".pdf")) {
      showToast({ type: "error", message: "Only PDF files are supported." });
      return;
    }

    setIsUploading(true);

    try {
      const { data: repairedProfile, error: profileError } = await withTimeout(
        supabase.rpc("ensure_user_profile"),
        "Profile setup is taking too long. Confirm the updated Supabase SQL has been run."
      );

      if (profileError) {
        showToast({
          type: "error",
          message: `${profileError.message}. Run the updated supabase/schema.sql in Supabase SQL Editor.`,
        });
        return;
      }

      const uploadProfile = (repairedProfile as Profile) ?? profile;
      const safeName = payload.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const storagePath = `${uploadProfile.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await withTimeout(
        supabase.storage.from("documents").upload(storagePath, payload.file, {
          contentType: "application/pdf",
        }),
        "PDF upload is taking too long. Check the Supabase storage bucket and policies."
      );

      if (uploadError) {
        showToast({ type: "error", message: uploadError.message });
        return;
      }

      const { data, error } = await withTimeout(
        supabase.rpc("create_document_with_credit", {
          p_title: payload.title,
          p_description: payload.description,
          p_storage_path: storagePath,
        }),
        "Credit update is taking too long. Confirm the Supabase SQL setup has been run."
      );

      if (error) {
        showToast({ type: "error", message: error.message });
        return;
      }

      setProfile((current) => (current ? { ...current, credits: Number(data) } : current));
      setIsUploadOpen(false);
      await loadDashboard();
      showToast({ type: "success", message: `File uploaded successfully! +${UPLOAD_REWARD} credits` });
    } catch (error) {
      showToast({
        type: "error",
        message: error instanceof Error ? error.message : "Upload failed. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document: DocumentRow) {
    if (!profile) {
      return;
    }

    if (profile.credits < document.download_cost) {
      showToast({ type: "error", message: "Not enough credits to download this document." });
      return;
    }

    setActiveDownloadId(document.id);
    const { data: updatedCredits, error: creditError } = await supabase.rpc("process_document_download", {
      p_document_id: document.id,
    });

    if (creditError) {
      setActiveDownloadId(null);
      showToast({ type: "error", message: creditError.message });
      return;
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.storage_path, 60);

    setActiveDownloadId(null);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      showToast({ type: "error", message: signedUrlError?.message || "Could not create download link." });
      return;
    }

    setProfile((current) => (current ? { ...current, credits: Number(updatedCredits) } : current));
    window.open(signedUrlData.signedUrl, "_blank", "noopener,noreferrer");
    showToast({ type: "success", message: `Download ready. -${document.download_cost} credits` });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="min-h-screen">
      <Toast toast={toast} />
      <UploadModal
        isOpen={isUploadOpen}
        isUploading={isUploading}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={handleUpload}
      />

      <header className="border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 text-white">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Welcome back</p>
              <h1 className="text-2xl font-black text-ink">{profile?.name || profile?.email || "Student"}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CreditBadge credits={profile?.credits ?? 0} />
            <button
              type="button"
              onClick={handleSignOut}
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-brand-100"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black text-ink">Explore notes</h2>
            <p className="mt-2 text-slate-600">Search community PDFs, download what helps, and upload your own material.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-mint-600 px-5 py-3 font-semibold text-white transition hover:bg-mint-500"
          >
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            Upload PDF
          </button>
        </div>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="focus-ring w-full rounded-md border border-line bg-white py-3 pl-11 pr-3 text-sm shadow-sm"
            placeholder="Search notes by title or description"
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              disabled={activeDownloadId === document.id}
              onDownload={handleDownload}
            />
          ))}
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="mt-8 rounded-md border border-dashed border-line bg-white px-6 py-12 text-center">
            <h3 className="text-xl font-bold text-ink">No notes found</h3>
            <p className="mt-2 text-slate-600">Upload the first PDF or adjust your search.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
