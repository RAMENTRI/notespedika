# Notespedika

Notespedika is a Next.js + Tailwind CSS + Supabase MVP for educational PDF sharing. Users receive 1,000 signup credits, earn 50 credits for each uploaded PDF, and spend 10 credits to download notes.

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase Auth, Postgres, RPC functions, and private Storage bucket
- Lucide React icons

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. In Supabase, open SQL Editor and run `supabase/schema.sql`.

4. Enable authentication:

- Email/password: Supabase Dashboard > Authentication > Providers > Email

5. Run the app:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Database Model

- `public.users`: profile, email, and credit balance. New auth users get exactly `1000` credits through `handle_new_user()`.
- `public.documents`: PDF metadata, uploader, private storage path, and download cost.
- `public.transactions`: signup/upload/download audit log.

## Business Logic

- `create_document_with_credit(...)` inserts document metadata only after the client uploads a PDF to Supabase Storage, then awards `+50` credits and writes a transaction.
- `process_document_download(...)` checks the current user's credits atomically, subtracts the document cost, and writes a transaction. The UI creates a short-lived signed URL only after the RPC succeeds.
- Storage bucket `documents` is private, PDF-only, and allows authenticated users to upload to their own folder.

## Important Supabase URL

In Supabase Authentication settings, set the Site URL for development:

- Site URL: `http://localhost:3000`
