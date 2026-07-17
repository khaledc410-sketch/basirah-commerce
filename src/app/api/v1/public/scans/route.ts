import { z } from "zod";

import { getServerEnv, isDemoMode } from "@/config/env";
import { enqueueVisibilityScan } from "@/core/jobs/visibility-queue";
import { isSameOrigin } from "@/core/security/request";
import { clientAddress, enforceRateLimit } from "@/core/security/rate-limit";
import { recordProductEvent } from "@/lib/telemetry/record";
import { telemetryOpaqueId } from "@/lib/telemetry/opaque-id";
import {
  correlatedJsonResponse,
  withRequestTelemetryContext,
  type RequestTelemetryContext,
} from "@/lib/telemetry/request-context";
import {
  createVisibilityScan,
  getVisibilityScanRepository,
  ScannerError,
  scheduleScan,
} from "@/modules/visibility/scanner";
import { normalizedUrlString } from "@/modules/visibility/scanner/url";
import { AcquisitionError } from "@/modules/acquisition/errors";
import { readBoundedJson } from "@/modules/acquisition/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({
  domain: z.string().trim().min(1).max(2048),
  locale: z.enum(["ar", "en"]).default("ar"),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()).default("SA"),
}).strict();

export async function POST(request: Request) {
  return withRequestTelemetryContext(request, (context) => createPublicScan(request, context));
}

async function createPublicScan(request: Request, context: RequestTelemetryContext) {
  const json = (body: unknown, init?: ResponseInit) =>
    correlatedJsonResponse(context, body, init);

  if (!getServerEnv().VISIBILITY_SCAN_ENABLED) {
    return json(
      {
        error: {
          code: "SCANNER_DISABLED",
          message: "الفحص متوقف مؤقتًا للصيانة. حاول مجددًا لاحقًا.",
        },
      },
      { status: 503 },
    );
  }

  if (request.headers.get("origin") && !isSameOrigin(request)) {
    return json(
      { error: { code: "INVALID_ORIGIN", message: "مصدر الطلب غير مسموح." } },
      { status: 403 },
    );
  }

  let rateLimit;
  try {
    rateLimit = await enforceRateLimit({
      namespace: "public-visibility-scan",
      identifier: clientAddress(request),
      limit: getServerEnv().PUBLIC_SCAN_RATE_LIMIT_PER_HOUR,
      windowSeconds: 60 * 60,
    });
  } catch {
    return json(
      { error: { code: "RATE_LIMIT_UNAVAILABLE", message: "تعذر التحقق من حد الاستخدام الآن." } },
      { status: 503 },
    );
  }
  if (!rateLimit.allowed) {
    return json(
      { error: { code: "RATE_LIMITED", message: "استخدمت الحد المتاح للفحص. حاول مجددًا لاحقًا." } },
      {
        status: 429,
        headers: {
          "retry-after": String(rateLimit.retryAfterSeconds),
          "x-ratelimit-remaining": "0",
        },
      },
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await readBoundedJson(request, 4_096);
  } catch (error) {
    if (error instanceof AcquisitionError) {
      return json(
        { error: { code: error.code, message: error.publicMessage } },
        { status: error.status },
      );
    }
    return json(
      { error: { code: "INVALID_REQUEST", message: "تعذر قراءة طلب الفحص." } },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(requestBody);
  if (!parsed.success) {
    return json({ error: { code: "INVALID_REQUEST", message: "أدخل نطاقًا صالحًا لبدء الفحص." } }, { status: 400 });
  }

  try {
    const normalizedDomain = new URL(normalizedUrlString(parsed.data.domain)).hostname;
    const domainLimit = await enforceRateLimit({
      namespace: "public-visibility-domain",
      identifier: normalizedDomain,
      limit: 1,
      windowSeconds: 120,
    });
    if (!domainLimit.allowed) {
      return json(
        {
          error: {
            code: "DOMAIN_COOLDOWN",
            message: "بدأ فحص لهذا النطاق مؤخرًا. انتظر قليلًا قبل إعادة المحاولة.",
          },
        },
        {
          status: 429,
          headers: { "retry-after": String(domainLimit.retryAfterSeconds) },
        },
      );
    }
  } catch (error) {
    if (error instanceof ScannerError) {
      return json(
        { error: { code: error.code, message: error.publicMessage } },
        { status: 400 },
      );
    }
    return json(
      {
        error: {
          code: "RATE_LIMIT_UNAVAILABLE",
          message: "تعذر التحقق من حد النطاق الآن.",
        },
      },
      { status: 503 },
    );
  }

  try {
    const record = await createVisibilityScan(parsed.data);
    try {
      await scheduleScan(
        record.token,
        isDemoMode()
          ? undefined
          : {
              enqueue: async (token) => {
                await enqueueVisibilityScan(token);
              },
            },
      );
    } catch (error) {
      await getVisibilityScanRepository().fail(record.token, {
        code: "SCAN_QUEUE_UNAVAILABLE",
        message: "تعذر وضع الفحص في قائمة التنفيذ.",
      });
      throw new ScannerError(
        "SCAN_QUEUE_UNAVAILABLE",
        "خدمة الفحص مشغولة الآن. حاول مجددًا بعد قليل.",
        error instanceof Error ? { cause: error } : undefined,
      );
    }
    recordProductEvent(
      {
        type: "visibility_check_submitted",
        source: "public_checker",
        scanId: telemetryOpaqueId("scan", record.token),
        locale: parsed.data.locale,
        countryCode: parsed.data.countryCode,
        pageLimit: Math.min(10, getServerEnv().VISIBILITY_SCAN_MAX_PAGES),
        entryPoint: "homepage",
      },
      context,
    );
    return json(
      {
        scan: { token: record.token, status: "queued", progress: 0 },
        links: {
          status: `/api/v1/public/scans/${record.token}/status`,
          preview: `/api/v1/public/scans/${record.token}/preview`,
        },
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof ScannerError) {
      const status = error.code === "SCAN_QUEUE_UNAVAILABLE" ? 503 : 400;
      return json({ error: { code: error.code, message: error.publicMessage } }, { status });
    }
    return json({ error: { code: "SCAN_CREATE_FAILED", message: "تعذر بدء الفحص الآن." } }, { status: 500 });
  }
}
