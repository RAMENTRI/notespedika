"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BookOpen, Mail } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Toast } from "@/components/Toast";
import type { Toast as ToastType } from "@/lib/types";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setToast({
        type: "error",
        message: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
      });
      return;
    }

    setIsLoading(true);
    setToast(null);

    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setIsLoading(false);

    if (result.error) {
      setToast({ type: "error", message: result.error.message });
      return;
    }

    setToast({
      type: "success",
      message: mode === "signup" ? "Account created. Check your email if confirmation is enabled." : "Welcome back!",
    });

    router.push("/dashboard");
  }

  async function handleGoogleAuth() {
    if (!isSupabaseConfigured) {
      setToast({
        type: "error",
        message: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
      });
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) {
      setToast({ type: "error", message: error.message });
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <Toast toast={toast} />
      <div className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-soft">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 font-black text-ink">
          <BookOpen className="h-6 w-6 text-brand-600" aria-hidden="true" />
          Notespedika
        </Link>

        <h1 className="text-3xl font-black text-ink">{mode === "signup" ? "Create your account" : "Login"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {mode === "signup"
            ? "New users receive exactly 1,000 free credits on signup."
            : "Return to your notes feed and credit balance."}
        </p>

        {!isSupabaseConfigured ? (
          <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            Add your Supabase URL and anon key in `.env.local`, then restart the dev server.
          </div>
        ) : null}

        <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
          {mode === "signup" ? (
            <label className="block">
              <span className="text-sm font-semibold text-ink">Name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="focus-ring mt-2 w-full rounded-md border border-line px-3 py-3 text-sm"
                placeholder="Aarav Sharma"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm font-semibold text-ink">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-line px-3 py-3 text-sm"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">Password</span>
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-line px-3 py-3 text-sm"
              placeholder="Minimum 6 characters"
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="focus-ring w-full rounded-md bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-300"
          >
            {isLoading ? "Please wait..." : mode === "signup" ? "Signup and get 1,000 credits" : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleAuth}
          className="focus-ring mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-3 font-semibold text-ink transition hover:border-brand-100"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          className="focus-ring mt-5 w-full rounded-md px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          {mode === "signup" ? "Already have an account? Login" : "Need an account? Signup"}
        </button>
      </div>
    </main>
  );
}
