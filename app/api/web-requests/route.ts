import { NextResponse } from "next/server";
import { createAnonServerClient } from "@/lib/supabase/anon-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const allowedRequestTypes = new Set(["appointment", "contact", "info"]);

type WebRequestPayload = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  request_type?: unknown;
  subject?: unknown;
  preferred_branch?: unknown;
  message?: unknown;
  source?: unknown;
};

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const text = readText(value);
  return text.length > 0 ? text : null;
}

function normalizeSource(value: unknown): string {
  const source = readText(value);
  return source.startsWith("website") ? source : "website";
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Talep sistemi şu anda yapılandırılmamış." },
      { status: 503 },
    );
  }

  let payload: WebRequestPayload;

  try {
    payload = (await request.json()) as WebRequestPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Geçersiz istek gövdesi." },
      { status: 400 },
    );
  }

  const name = readText(payload.name);
  const phone = readText(payload.phone);
  const requestType = readText(payload.request_type);

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Ad soyad alanı zorunludur." },
      { status: 400 },
    );
  }

  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "Telefon alanı zorunludur." },
      { status: 400 },
    );
  }

  if (!allowedRequestTypes.has(requestType)) {
    return NextResponse.json(
      { ok: false, error: "Geçersiz talep türü." },
      { status: 400 },
    );
  }

  const supabase = createAnonServerClient();
  const { error } = await supabase.from("web_requests").insert({
    name,
    phone,
    email: optionalText(payload.email),
    request_type: requestType,
    subject: optionalText(payload.subject),
    preferred_branch: optionalText(payload.preferred_branch),
    message: optionalText(payload.message),
    status: "new",
    source: normalizeSource(payload.source),
  });

  if (error) {
    console.error("web_requests insert failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    return NextResponse.json(
      { ok: false, error: "Talep kaydedilemedi. Lütfen tekrar deneyin." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
