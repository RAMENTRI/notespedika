import { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const allowedRequestHeaders = new Set([
  "accept",
  "apikey",
  "authorization",
  "content-type",
  "prefer",
  "x-client-info",
  "x-upsert",
]);

const blockedResponseHeaders = new Set(["connection", "content-encoding", "content-length"]);

async function proxySupabaseRequest(request: NextRequest) {
  if (!supabaseUrl) {
    return Response.json({ error: "Supabase URL is not configured." }, { status: 500 });
  }

  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return Response.json({ error: "Missing Supabase target URL." }, { status: 400 });
  }

  const targetUrl = new URL(target);
  const allowedOrigin = new URL(supabaseUrl).origin;

  if (targetUrl.origin !== allowedOrigin) {
    return Response.json({ error: "Blocked non-Supabase proxy target." }, { status: 400 });
  }

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (allowedRequestHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    });
  } catch (error) {
    return Response.json(
      {
        error: "Supabase proxy request failed.",
        detail: error instanceof Error ? error.message : "Unknown fetch error.",
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!blockedResponseHeaders.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const dynamic = "force-dynamic";

export const GET = proxySupabaseRequest;
export const POST = proxySupabaseRequest;
export const PUT = proxySupabaseRequest;
export const PATCH = proxySupabaseRequest;
export const DELETE = proxySupabaseRequest;
