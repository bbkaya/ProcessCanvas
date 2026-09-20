import { createClient } from "npm:@supabase/supabase-js@2";
import {
  PROCESS_CANVAS_AI_JSON_SCHEMA,
  buildProcessCanvasAIPrompt,
  normalizeAIProcessCanvasDraft,
} from "../../../src/processCanvas/processCanvasAI.ts";

const PRODUCTION_ORIGINS = new Set([
  "https://processcanvas.org",
  "https://www.processcanvas.org",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (PRODUCTION_ORIGINS.has(origin)) return true;

  try {
    const url = new URL(origin);
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin)
      ? origin!
      : "https://processcanvas.org",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      ...extraHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const newSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");

  let secretKey: string | undefined;

  if (newSecretKeys) {
    try {
      const parsed = JSON.parse(newSecretKeys) as Record<string, string>;
      secretKey = parsed.default;
    } catch {
      // Fall through to the legacy key below.
    }
  }

  secretKey ||= Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined;

  if (!url || !secretKey) {
    throw new Error("Supabase server credentials are unavailable.");
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  return cfIp || null;
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function checkAndConsumeQuota(req: Request) {
  const clientIp = getClientIp(req);

  if (!clientIp) {
    throw new Error("Could not determine the caller network address.");
  }

  // Store only a hash in Postgres rather than the plain address.
  const clientHash = await sha256(`process-canvas-ai:${clientIp}`);
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.rpc(
    "consume_process_canvas_ai_quota",
    { p_client_hash: clientHash },
  );

  if (error) {
    throw new Error(`Rate-limit check failed: ${error.message}`);
  }

  const quota = Array.isArray(data) ? data[0] : data;

  if (!quota || typeof quota.allowed !== "boolean") {
    throw new Error("Rate-limit service returned an invalid response.");
  }

  return quota as {
    allowed: boolean;
    requests_last_hour: number;
    requests_last_day: number;
    hourly_limit: number;
    daily_limit: number;
  };
}

async function verifyTurnstile(
  token: string,
  clientIp: string | null,
): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");

  if (!secret) {
    throw new Error("TURNSTILE_SECRET_KEY is not configured.");
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (clientIp) formData.append("remoteip", clientIp);

  const verificationResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    },
  );

  if (!verificationResponse.ok) {
    throw new Error("Human-verification service is temporarily unavailable.");
  }

  const result = await verificationResponse.json() as {
    success?: boolean;
    action?: string;
  };

  return (
    result.success === true &&
    result.action === "generate_process_canvas"
  );
}

function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data?.output)) return "";

  const parts: string[] = [];

  for (const item of data.output) {
    if (!item || item.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }

    for (const contentPart of item.content) {
      if (
        contentPart?.type === "output_text" &&
        typeof contentPart.text === "string" &&
        contentPart.text.trim()
      ) {
        parts.push(contentPart.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function extractRefusal(data: any): string {
  if (!Array.isArray(data?.output)) return "";

  for (const item of data.output) {
    if (!item || item.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }

    for (const contentPart of item.content) {
      if (
        contentPart?.type === "refusal" &&
        typeof contentPart.refusal === "string"
      ) {
        return contentPart.refusal;
      }
    }
  }

  return "";
}

export default {
  async fetch(req: Request): Promise<Response> {
    const origin = req.headers.get("origin");

    if (!isAllowedOrigin(origin)) {
      return jsonResponse(
        req,
        {
          ok: false,
          error: "Requests from this origin are not allowed.",
        },
        403,
      );
    }

    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders(req) });
    }

    if (req.method !== "POST") {
      return jsonResponse(
        req,
        { ok: false, error: "Method not allowed. Use POST." },
        405,
      );
    }

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      return jsonResponse(
        req,
        { ok: false, error: "OPENAI_API_KEY is not configured." },
        500,
      );
    }

    let body: {
      processDescription?: unknown;
      turnstileToken?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        req,
        { ok: false, error: "Request body must be valid JSON." },
        400,
      );
    }

    if (typeof body.processDescription !== "string") {
      return jsonResponse(
        req,
        { ok: false, error: "processDescription must be a string." },
        400,
      );
    }

    if (
      typeof body.turnstileToken !== "string" ||
      !body.turnstileToken.trim()
    ) {
      return jsonResponse(
        req,
        { ok: false, error: "Human verification is required." },
        400,
      );
    }

    const processDescription = body.processDescription.trim();
    const turnstileToken = body.turnstileToken.trim();

    if (turnstileToken.length > 2048) {
      return jsonResponse(
        req,
        { ok: false, error: "Invalid human-verification token." },
        400,
      );
    }

    if (processDescription.length < 10) {
      return jsonResponse(
        req,
        {
          ok: false,
          error: "Please provide a more complete process description.",
        },
        400,
      );
    }

    if (processDescription.length > 12000) {
      return jsonResponse(
        req,
        {
          ok: false,
          error:
            "The process description is too long (maximum 12,000 characters).",
        },
        400,
      );
    }

    try {
      const clientIp = getClientIp(req);
      const humanVerified = await verifyTurnstile(
        turnstileToken,
        clientIp,
      );

      if (!humanVerified) {
        return jsonResponse(
          req,
          {
            ok: false,
            error:
              "Human verification failed or expired. Please verify again and retry.",
          },
          403,
        );
      }

      const quota = await checkAndConsumeQuota(req);

      if (!quota.allowed) {
        return jsonResponse(
          req,
          {
            ok: false,
            error: "AI generation limit reached.",
            details: {
              message:
                "Too many Process Canvas generations have been requested from this network. Please try again later.",
              requestsLastHour: quota.requests_last_hour,
              requestsLastDay: quota.requests_last_day,
              hourlyLimit: quota.hourly_limit,
              dailyLimit: quota.daily_limit,
            },
          },
          429,
          { "Retry-After": "3600" },
        );
      }

      const prompt = buildProcessCanvasAIPrompt(processDescription);
      const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.2";

      const openAiResponse = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            store: false,
            max_output_tokens: 6000,
            input: [
              {
                role: "system",
                content: prompt.system,
              },
              {
                role: "user",
                content: prompt.user,
              },
            ],
            text: {
              verbosity: "low",
              format: {
                type: "json_schema",
                name: "process_canvas_draft",
                strict: true,
                schema: PROCESS_CANVAS_AI_JSON_SCHEMA,
              },
            },
          }),
        },
      );

      const data = await openAiResponse.json();

      if (!openAiResponse.ok) {
        const apiError =
          data && typeof data === "object" && "error" in data
            ? (
                data as {
                  error?: {
                    message?: string;
                    code?: string;
                    type?: string;
                  };
                }
              ).error
            : undefined;

        return jsonResponse(
          req,
          {
            ok: false,
            error: "OpenAI API request failed.",
            details: {
              message:
                apiError?.message ?? "Unknown OpenAI API error.",
              code: apiError?.code ?? null,
              type: apiError?.type ?? null,
            },
          },
          openAiResponse.status,
        );
      }

      if (data.status && data.status !== "completed") {
        return jsonResponse(
          req,
          {
            ok: false,
            error:
              `OpenAI response did not complete successfully (status: ${data.status}).`,
          },
          502,
        );
      }

      const refusal = extractRefusal(data);
      if (refusal) {
        return jsonResponse(
          req,
          {
            ok: false,
            error: "OpenAI declined to generate this Process Canvas.",
            details: refusal,
          },
          422,
        );
      }

      const outputText = extractOutputText(data);

      if (!outputText) {
        return jsonResponse(
          req,
          {
            ok: false,
            error: "OpenAI returned no structured Process Canvas output.",
          },
          502,
        );
      }

      let parsedDraft: unknown;

      try {
        parsedDraft = JSON.parse(outputText);
      } catch {
        return jsonResponse(
          req,
          {
            ok: false,
            error:
              "OpenAI returned structured output that could not be parsed.",
          },
          502,
        );
      }

      const draft = normalizeAIProcessCanvasDraft(parsedDraft);

      return jsonResponse(req, {
        ok: true,
        draft,
        model: data.model ?? model,
      });
    } catch (error) {
      return jsonResponse(
        req,
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error while generating the Process Canvas.",
        },
        500,
      );
    }
  },
};
