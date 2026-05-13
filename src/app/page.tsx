import Link from "next/link";
import { ArrowRight, BookOpen, Coins, ShieldCheck, UploadCloud } from "lucide-react";

const features = [
  {
    title: "Start with 1,000 credits",
    description: "Every new Notespedika account receives a useful balance immediately after signup.",
    icon: Coins,
  },
  {
    title: "Earn by uploading",
    description: "Share approved PDF notes and receive 50 credits for contributing to the library.",
    icon: UploadCloud,
  },
  {
    title: "Spend to download",
    description: "Download helpful study material using a simple 10-credit document cost.",
    icon: BookOpen,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-black tracking-tight text-ink">
          Notespedika
        </Link>
        <Link
          href="/auth"
          className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Login / Signup
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-14 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20 lg:pt-16">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-brand-100 bg-white px-3 py-2 text-sm font-semibold text-brand-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Academic notes, powered by credits
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-normal text-ink md:text-6xl">
            Notespedika
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            A clean educational exchange where students and teachers upload PDF notes, earn credits, and discover study material without friction.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700"
            >
              Start sharing notes
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="focus-ring inline-flex items-center justify-center rounded-md border border-line bg-white px-5 py-3 font-semibold text-ink transition hover:border-brand-100"
            >
              Explore dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-md border border-line bg-white p-5 shadow-soft">
          <div className="grid gap-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4 rounded-md border border-line bg-paper p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-bold text-ink">{feature.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
